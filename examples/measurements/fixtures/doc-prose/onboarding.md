# Getting started at Acme Engineering

Welcome to the team! We are really glad that you are here, and we hope that
your first few weeks are going to be a good experience for you. This document
is intended to be a guide to help you get up and running as quickly as is
reasonably possible, and it covers a number of the things that new engineers
typically need to know in their first week or two on the job.

## Your laptop

The first thing that you are going to want to do, more or less as soon as you
have received your laptop from the IT team, is to make sure that it is fully
set up. This means installing the tools that we use. We use a fairly standard
toolchain here, and most of it can be installed by running the bootstrap
script that lives in the platform repository. You will need to have access to
that repository first, which means you will need to be added to the
engineering group in our identity provider, which your manager should have
requested for you before your start date, although in practice this sometimes
does not happen and you may need to ask.

Once you have access, clone the platform repository and run
`./scripts/bootstrap.sh`. This is going to take a while — usually somewhere
in the region of twenty to forty minutes depending on your network — because
it installs a lot of things. Go and get a coffee.

## Access and accounts

There are a number of systems that you are going to need access to, and
unfortunately they are not all provisioned automatically at the moment,
although this is something the platform team has on their roadmap. The ones
that are provisioned automatically are email, Slack, and the identity
provider itself. The ones that are not, and which you will need to request
individually, are the cloud console, the observability stack, the incident
management tool, the design tool, and the analytics warehouse.

To request access to any of these, file a ticket in the IT service desk
project. Use the "Access request" template. Tickets are usually turned around
within one business day, but if it is urgent you can also ask in the
#it-help channel and somebody will normally pick it up faster than that.

## How we work

We work in two week iterations. Each iteration starts with a planning session
on Monday morning, where the team looks at what is in the backlog and decides
what it is going to commit to for the coming two weeks. There is a standup
every morning at 9:45, which is deliberately short — fifteen minutes maximum,
and if a conversation is going to run longer than that we take it offline and
follow up separately with the people who actually need to be involved.

At the end of each iteration there is a demo on Thursday afternoon, followed
by a retrospective. The demo is informal and you should not feel like you
need to prepare slides for it. The retrospective is where we talk about what
went well and what did not, and it is genuinely one of the more useful
meetings we have, so please do come to it with things to say.

## Code review

Every change goes through review. We do not have a formal rule about the
number of approvals required, but in practice most pull requests get one
approval from somebody on the team who knows the area. If you are touching
something that crosses team boundaries, it is a good idea to also get a
review from somebody on the other team, and the CODEOWNERS file will
usually tell you who that is.

Reviews should be timely. If a pull request has been sitting for more than
a day without anybody looking at it, it is completely fine to nudge people
in the team channel. We would much rather you nudged than sat quietly
waiting for somebody to notice.

## Deploying

We deploy continuously. When a pull request is merged into the main branch,
it goes to staging automatically. Promotion to production is a manual step
that anybody on the team can perform, and it is done through the deploy tool.
Before promoting, have a quick look at the staging dashboards to make sure
nothing looks obviously wrong.

If something does go wrong in production, do not panic, and do not try to fix
forward under pressure. Roll back first, then investigate. The deploy tool
has a rollback button and it is the fastest path back to a working system.

## Asking for help

Please ask for help. Seriously. There is no expectation that you will figure
things out on your own, and the fastest way to get productive here is to ask
somebody who already knows. The team channel is the right place for most
questions, and if you would rather ask somebody one to one, your onboarding
buddy is there for exactly that reason.
