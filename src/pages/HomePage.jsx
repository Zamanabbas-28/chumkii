import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Hero from '../components/Hero'
import CategorySection from '../components/CategorySection'
import FeaturedCreations from '../components/FeaturedCreations'
import CustomizationSection from '../components/CustomizationSection'
import SizeGuide from '../components/SizeGuide'
import HowItWorks from '../components/HowItWorks'
import About from '../components/About'
import FAQ from '../components/FAQ'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import CartDrawer from '../components/CartDrawer'
import RecentlyViewed from '../components/RecentlyViewed'
import BackToTop from '../components/BackToTop'
import { scrollToId } from '../utils/format'

export default function HomePage() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      requestAnimationFrame(() => scrollToId(id))
    }
  }, [location.hash, location.pathname])

  return (
    <div className="min-h-screen overflow-x-hidden bg-ivory text-ink">
      <Navbar />
      <main>
        <Hero />
        <CategorySection onSelectCategory={setCategoryFilter} />
        <FeaturedCreations
          categoryFilter={categoryFilter}
          onClearFilter={() => setCategoryFilter('all')}
        />
        <RecentlyViewed />
        <CustomizationSection />
        <SizeGuide />
        <HowItWorks />
        <About />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <CartDrawer />
      <BackToTop />
    </div>
  )
}
