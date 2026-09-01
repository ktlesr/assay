export function Checkout({ items, total, onSubmit }) {
  return (
    <div className="checkout">
      <div className="checkout-title">Checkout</div>

      <div className="items">
        {items.map((i) => (
          <div key={i.id} className="item">
            <span>{i.name}</span>
            <span>{i.price}</span>
            <div className="remove" onClick={() => i.onRemove(i.id)}>x</div>
          </div>
        ))}
      </div>

      <div className="total">Total: {total}</div>

      <form onSubmit={onSubmit}>
        <div className="field">
          <div>Card number</div>
          <input className="input" type="text" />
        </div>
        <div className="field">
          <div>Expiry</div>
          <input className="input" type="text" />
        </div>
        <div className="error">Card number is invalid</div>
        <div className="pay" onClick={onSubmit}>Pay now</div>
      </form>
    </div>
  )
}
