import { PrismaAdapter } from '@auth/prisma-adapter'
import { isConfigured, prisma } from '@assay/db'
import { verify } from '@node-rs/argon2'
import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { rateLimit } from './rate-limit'

/**
 * Kimlik doğrulama.
 *
 * Kendi oturum yönetimimizi yazmama kararı (docs/stack.md): Auth.js.
 *
 * Oturum stratejisi JWT — Auth.js'te credentials sağlayıcısı veritabanı
 * oturumuyla çalışmıyor. Prisma adaptörü yine de duruyor: OAuth hesapları ve
 * kullanıcı kaydı veritabanında. Rol her istekte token'dan okunuyor;
 * yükseltme/düşürme anında geçsin diye token'ın `role`'ü her `jwt` çağrısında
 * kullanıcıdan tazeleniyor.
 */

declare module 'next-auth' {
  interface Session {
    user: { id: string; role: 'USER' | 'ADMIN' } & DefaultSession['user']
  }
}

const googleId = process.env['AUTH_GOOGLE_ID']
const googleSecret = process.env['AUTH_GOOGLE_SECRET']

/** Google yalnızca kimlik bilgileri verildiğinde açılır; boş anahtarla sağlayıcı gösterilmez. */
export const googleEnabled =
  googleId !== undefined && googleId !== '' && googleSecret !== undefined && googleSecret !== ''

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(isConfigured() ? { adapter: PrismaAdapter(prisma()) } : {}),
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  trustHost: true,
  providers: [
    ...(googleId !== undefined && googleId !== '' && googleSecret !== undefined && googleSecret !== ''
      ? [Google({ clientId: googleId, clientSecret: googleSecret })]
      : []),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = typeof credentials['email'] === 'string' ? credentials['email'] : ''
        const password =
          typeof credentials['password'] === 'string' ? credentials['password'] : ''
        if (email === '' || password === '') return null

        // Aynı hesaba karşı kaba kuvvet denemesi ücretsiz olmasın.
        if (!rateLimit(`signin:${email.toLowerCase()}`, 5, 60_000)) return null
        if (!isConfigured()) return null

        const user = await prisma().user.findUnique({ where: { email: email.toLowerCase() } })
        if (user === null || user.passwordHash === null) return null
        if (user.suspendedAt !== null) return null
        if (!(await verify(user.passwordHash, password))) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id !== undefined) token.sub = user.id
      if (token.sub !== undefined && isConfigured()) {
        const current = await prisma().user.findUnique({
          where: { id: token.sub },
          select: { role: true, suspendedAt: true },
        })
        // Askıya alınan kullanıcının token'ı bir sonraki istekte ölür.
        if (current === null || current.suspendedAt !== null) return null
        token['role'] = current.role
      }
      return token
    },
    session: ({ session, token }) => {
      if (token.sub !== undefined) session.user.id = token.sub
      session.user.role = token['role'] === 'ADMIN' ? 'ADMIN' : 'USER'
      return session
    },
  },
})
