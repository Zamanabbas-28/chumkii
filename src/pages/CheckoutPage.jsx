import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CartDrawer from '../components/CartDrawer'
import CheckoutForm from '../components/CheckoutForm'
import CheckoutProgress from '../components/CheckoutProgress'

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-ivory text-ink">
      <Navbar solid />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <CheckoutProgress current="checkout" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-gold">
          Checkout
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Complete your order
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          <Link to="/" className="underline-offset-2 hover:underline">
            ← Continue shopping
          </Link>
        </p>
        <div className="mt-10">
          <CheckoutForm />
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
