// File: client/src/pages/News/NewsPage.jsx
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import React from 'react'
import DashboardLayout from '../Layout/DashboardLayout'

const NewsPage = () => {
  const heroNews = {
    id: 1,
    title:
      'Historic NIL Deal: Top Athlete Secures Multi-Million Dollar Partnership',
    description:
      'A groundbreaking NIL agreement sets new records in athlete endorsements and brand partnerships, reshaping the landscape for future deals.',
    image:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop',
    source: 'NIL Daily',
    date: '2h ago',
    featured: true,
  }
  const breakingNews = [
    {
      id: 2,
      title:
        'NCAA Releases Major Overhaul to NIL Guidelines, Introducing New Compliance Rules That Could Reshape Athlete Sponsorship Deals Across All Divisions',
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
      source: 'Sports League Update',
      date: '4h ago',
    },
    {
      id: 3,
      title:
        'Emerging Brand Partnership Trends Reveal How Companies Are Leveraging Micro-Influencers, Data-Driven Campaigns, and Authentic Athlete Storytelling in 2025',
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
      source: 'Brand Insights',
      date: '6h ago',
    },
    {
      id: 4,
      title:
        'Top Athletes Secure Multi-Million Dollar Endorsement Deals as Agencies Report a Surge in Cross-Industry Collaborations Between Sports, Tech, and Lifestyle Brands',
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
      source: 'Athlete Network',
      date: '8h ago',
    },
    {
      id: 5,
      title:
        'Q4 Market Analysis Report Shows Massive Shifts in Consumer Spending, Sponsorship ROI, and Media Valuations as Brands Prepare for a Competitive 2026 Landscape',
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
      source: 'Market Research',
      date: '1d ago',
    },
    {
      id: 6,
      title:
        'Top Sports Agents Share Advanced Negotiation Strategies for 2025, Including Multi-Tier Contract Structuring, Performance-Linked Bonuses, and Brand-First Approaches',
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
      source: 'Pro Advisors',
      date: '1d ago',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <DashboardLayout>
      <div className='w-full min-h-screen bg-stone-50'>
        <motion.div
          className='mx-auto px-4 md:px-8 py-6 max-w-8xl'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {/* Page Title */}
          <motion.div variants={itemVariants} className='mb-6'>
            <h1 className='text-lg font-bold text-gray-900 md:text-4xl'>
              News
            </h1>
          </motion.div>

          {/* Featured Section with Breaking News List */}
          <motion.div
            variants={itemVariants}
            className='mb-6 rounded-lg overflow-hidden bg-white border border-gray-200'
          >
            <div className='flex flex-col md:grid md:grid-cols-[1fr_1fr] gap-0'>
              {/* Left Side - Featured Article */}
              <div className='flex flex-col order-1 md:order-1'>
                {/* Featured Image */}
                <div className='relative overflow-hidden h-40 md:h-96'>
                  <img
                    src={heroNews.image}
                    alt={heroNews.title}
                    className='w-full h-full object-cover'
                  />
                </div>

                {/* Featured Article Content */}
                <div className='p-4 md:p-6 flex flex-col'>
                  <div className='mb-2 inline-flex items-center gap-2 w-fit'>
                    <div className='w-2 h-2 rounded-full bg-[#163146]' />
                    <span className='text-xs font-semibold text-[#163146]'>
                      FEATURED
                    </span>
                  </div>
                  <h2 className='text-lg md:text-3xl font-bold text-gray-900 mb-2 md:mb-4 leading-tight'>
                    {heroNews.title}
                  </h2>
                  <p className='text-xs md:text-sm text-gray-600 mb-3 md:mb-6 leading-relaxed'>
                    {heroNews.description}
                  </p>
                  <div className='flex flex-col gap-1 md:flex-row md:items-center md:gap-4 pt-2 md:pt-4 border-t border-gray-200'>
                    <span className='text-xs text-gray-500'>
                      {heroNews.source}
                    </span>
                    <span className='text-xs text-gray-500'>
                      {heroNews.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Breaking News List */}
              <div className='p-4 md:p-6 flex flex-col order-2 md:order-2'>
                <div className='flex items-center justify-between gap-2 mb-4'>
                  <h2 className='text-base md:text-xl font-bold text-gray-900'>
                    Breaking News
                  </h2>
                </div>

                {/* Breaking News List */}
                <div className='flex flex-col'>
                  {breakingNews.map((news, index) => (
                    <div key={news.id}>
                      <div className='flex gap-3 md:gap-4 cursor-pointer hover:opacity-80 transition-opacity py-4'>
                        {/* Thumbnail */}
                        <div className='relative overflow-hidden h-24 w-24 md:h-28 md:w-28 flex-shrink-0 rounded-lg'>
                          <img
                            src={news.image}
                            alt={news.title}
                            className='w-full h-full object-cover'
                          />
                        </div>

                        {/* News Info */}
                        <div className='flex-1 flex flex-col justify-between min-w-0'>
                          <div>
                            <h3 className='font-bold text-base md:text-lg text-gray-900 mb-2'>
                              {news.title}
                            </h3>
                          </div>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='text-xs text-gray-500'>
                              {news.source}
                            </span>
                            <span className='text-xs text-gray-400'>
                              {news.date}
                            </span>
                          </div>
                        </div>
                      </div>
                      {index < breakingNews.length - 1 && (
                        <div className='border-t border-gray-200'></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer Spacing */}
          <div className='h-4'></div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
export default NewsPage
