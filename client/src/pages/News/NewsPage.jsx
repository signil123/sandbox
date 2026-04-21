import axios from 'axios'
import React, { useEffect, useState } from 'react'
import DashboardLayout from '../Layout/DashboardLayout'

const NewsPage = () => {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const apiKey = import.meta.env.VITE_NEWS_API
        if (!apiKey) {
          throw new Error('News API key is missing (VITE_NEWS_API)')
        }

        // Fetch news about NIL, athlete endorsements, sports business
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: '"NIL" OR "athlete endorsement" OR "sports business"',
            language: 'en',
            sortBy: 'publishedAt',
            apiKey: apiKey,
          },
        })

        if (response.data.status === 'ok') {
          // Format the data
          const formattedNews = response.data.articles
            .filter((article) => article.urlToImage) // Filter out articles without images
            .map((article, index) => ({
              id: index,
              title: article.title,
              description: article.description,
              image: article.urlToImage,
              source: article.source.name,
              date: new Date(article.publishedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
              url: article.url,
            }))
          setNews(formattedNews)
        } else {
          throw new Error('Failed to fetch news')
        }
      } catch (err) {
        console.error('Error fetching news:', err)
        setError(err.message || 'Failed to load news')
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  // Split news into hero and list
  const heroNews = news.length > 0 ? news[0] : null
  const breakingNews = news.length > 1 ? news.slice(1) : [] // Show all remaining items

  return (
    <DashboardLayout>
      <div className='md:fixed md:left-[260px] md:right-4 md:top-4 md:bottom-4 md:overflow-hidden h-[calc(100vh-64px)] md:h-auto overflow-hidden flex flex-col'>
        <div className='w-full h-full flex-1 flex flex-col min-h-0 md:bg-white md:rounded-[18px] md:border md:border-[rgba(22,49,70,0.05)] md:px-5 md:py-4 md:overflow-hidden bg-[#F9FAFB] px-4 py-6'>
          
          {/* Header */}
          <div className='mb-6 flex-shrink-0 flex items-baseline justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 tracking-tight'>
                News Feed
              </h1>
              <p className='text-gray-500 mt-1 text-sm'>
                Latest updates on NIL, athlete endorsements, and sports business.
              </p>
            </div>
           
          </div>

          {loading ? (
             <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 flex-1 min-h-0 animate-pulse'>
              <div className='lg:col-span-2 h-full bg-gray-200 rounded-xl'></div>
              <div className='lg:col-span-1 h-full bg-gray-200 rounded-xl'></div>
            </div>
          ) : error ? (
            <div className='flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-red-100 shadow-sm'>
              <div className='text-red-500 mb-2'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-10 w-10'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <p className='text-gray-900 font-medium'>{error}</p>
              <p className='text-sm text-gray-500 mt-1'>
                Please check your API configuration.
              </p>
            </div>
          ) : news.length === 0 ? (
            <div className='text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed'>
              <p className='text-lg font-medium text-gray-900'>No news found</p>
              <p className='text-sm text-gray-500 mt-1'>
                Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 flex-1 min-h-0'>
              {/* Featured Article - Takes up 2 columns */}
              {heroNews && (
                <div 
                  className='lg:col-span-2 h-full min-h-0 rounded-2xl overflow-hidden cursor-pointer'
                  onClick={() => window.open(heroNews.url, '_blank')}
                >
                  <div
                    className='group block relative h-full w-full'
                  >
                    {/* Image Background */}
                      <div className='absolute inset-0'>
                        <img
                          src={heroNews.image}
                          alt=''
                          aria-hidden='true'
                          className='w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700'
                        />
                      {/* Gradient Overlay */}
                      <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent' />
                    </div>

                    {/* Content Overlay */}
                    <div className='absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end h-full text-white pointer-events-none'>
                      <div className='mb-auto pointer-events-auto'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#163146] text-white border border-white/20 tracking-wide'>
                           FEATURED
                        </span>
                      </div>
                      
                      <div className='transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-auto'>
                        <div className='flex items-center gap-2 text-xs font-medium text-gray-300 mb-3'>
                          <span className='text-[#cbbea8] uppercase tracking-wider'>{heroNews.source}</span>
                          <span className='w-1 h-1 rounded-full bg-gray-500'></span>
                          <span>{heroNews.date}</span>
                        </div>
                        
                        <h2 className='text-2xl md:text-4xl font-bold leading-tight mb-3 text-white group-hover:text-gray-100 transition-colors'>
                          {heroNews.title}
                        </h2>
                        
                        <p className='text-sm md:text-base text-gray-300 line-clamp-2 max-w-2xl opacity-90 group-hover:opacity-100 transition-opacity'>
                          {heroNews.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Breaking News List - Takes up 1 column */}
              <div className='lg:col-span-1 flex flex-col h-full min-h-0 overflow-hidden'>
                <div className='flex items-center justify-between mb-4 flex-shrink-0'>
                  <h2 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
                    <span className='w-1.5 h-6 bg-[#163146] rounded-full'></span>
                    Trending Stories
                  </h2>
                </div>

                <div className='flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar'>
                  {breakingNews.map((newsItem) => (
                    <a
                      key={newsItem.id}
                      href={newsItem.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='group flex gap-4 p-3 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-sm transition-all duration-200'
                    >
                      <div className='relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100'>
                        <img
                          src={newsItem.image}
                          alt=''
                          aria-hidden='true'
                          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                        />
                      </div>
                      
                      <div className='flex flex-col justify-between py-0.5 min-w-0 flex-1'>
                        <div>
                          <span className='text-[10px] font-bold text-[#163146] uppercase tracking-wide mb-1 block'>
                            {newsItem.source}
                          </span>
                          <h3 className='text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#163146] transition-colors'>
                            {newsItem.title}
                          </h3>
                        </div>
                        <p className='text-xs text-gray-400 font-medium mt-2'>
                          {newsItem.date}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
export default NewsPage
