                <AnimatePresence mode='wait'>
                  {isNotificationOpen && (
                    <>
                      {/* Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className='fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]'
                        onClick={() => setIsNotificationOpen(false)}
                      />

                      {/* Drawer */}
                      <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className='fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden'
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header - Brand Color */}
                        <div className='flex items-center justify-between px-6 py-5 bg-[#163146] text-white shrink-0 relative overflow-hidden'>
                          {/* Background Accent Gradient */}
                          <div className='absolute -top-10 -right-10 w-32 h-32 bg-[#986a41] rounded-full blur-[50px] opacity-20 pointer-events-none' />

                          <div className='flex items-center gap-3 relative z-10'>
                            <div className='relative'>
                              <Bell size={20} className='text-[#986a41]' />
                              {unreadCount > 0 && (
                                <span className='absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#986a41] rounded-full ring-2 ring-[#163146]' />
                              )}
                            </div>
                            <div>
                              <h3 className='text-lg font-bold leading-none tracking-tight'>
                                Notifications
                              </h3>
                              <p className='text-[11px] text-gray-300 font-medium mt-1.5 opacity-80'>
                                {unreadCount === 0
                                  ? 'No new messages'
                                  : `${unreadCount} unread message${
                                      unreadCount === 1 ? '' : 's'
                                    }`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsNotificationOpen(false)}
                            className='w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white relative z-10'
                          >
                            <X size={18} />
                          </button>
                        </div>



                        {/* Tabs Header */}
                        <div className='px-6 pt-4 pb-2 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-20'>
                            <div className='flex items-center gap-1 bg-gray-100 p-1 rounded-lg'>
                                {['all', 'invitations', 'updates'].map((tab) => {
                                    const label = tab.charAt(0).toUpperCase() + tab.slice(1)
                                    const isActive = activeTab === tab
                                    
                                    // Count logic
                                    const invitationTypes = ['connection_request', 'event_invitation']
                                    const count = tab === 'all' 
                                        ? notifications.length 
                                        : tab === 'invitations' 
                                            ? notifications.filter(n => invitationTypes.includes(n.type)).length
                                            : notifications.filter(n => !invitationTypes.includes(n.type)).length

                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 relative flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all z-10 ${
                                                isActive ? 'text-[#163146]' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId='activeTab'
                                                    className='absolute inset-0 bg-white shadow-sm rounded-md border border-gray-200/50'
                                                    initial={false}
                                                    transition={{ type: 'tween', ease: 'easeInOut', duration: 0.25 }}
                                                />
                                            )}
                                            <span className="relative z-10">{label}</span>
                                            {count > 0 && (
                                                <span className={`relative z-10 text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[#163146]/10 text-[#163146]' : 'bg-gray-200 text-gray-600'}`}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className='flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30'>
                          {notifications.length === 0 ? (
                            <div className='flex flex-col items-center justify-center h-full text-center p-8'>
                              <div className='w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300'>
                                <Bell size={32} />
                              </div>
                              <h4 className='text-gray-900 font-semibold'>
                                No notifications
                              </h4>
                              <p className='text-sm text-gray-500 mt-1 max-w-[200px] leading-relaxed'>
                                We'll notify you when something important arrives.
                              </p>
                            </div>
                          ) : (
                            (() => {
                                const invitationTypes = ['connection_request', 'event_invitation']
                                let filtered = notifications
                                if (activeTab === 'invitations') {
                                    filtered = notifications.filter(n => invitationTypes.includes(n.type))
                                } else if (activeTab === 'updates') {
                                    filtered = notifications.filter(n => !invitationTypes.includes(n.type))
                                }

                                if (filtered.length === 0) {
                                    return (
                                        <div className='flex flex-col items-center justify-center py-12 text-center'>
                                            <p className='text-sm text-gray-400'>No notifications in this category</p>
                                        </div>
                                    )
                                }

                                // Group by date
                                const groups = filtered.reduce((acc, notif) => {
                                    const date = new Date(notif.createdAt)
                                    const now = new Date()
                                    const isToday = date.toDateString() === now.toDateString()
                                    const yesterday = new Date(now)
                                    yesterday.setDate(yesterday.getDate() - 1)
                                    const isYesterday = date.toDateString() === yesterday.toDateString()
                                    const key = isToday ? 'Today' : isYesterday ? 'Yesterday' : 'Older'
                                    if (!acc[key]) acc[key] = []
                                    acc[key].push(notif)
                                    return acc
                                }, {})

                                const order = ['Today', 'Yesterday', 'Older']

                                return (
                                    <div className="space-y-6">
                                        {order.map((group) => {
                                            const items = groups[group]
                                            if (!items || items.length === 0) return null

                                            return (
                                                <div key={group} className='animate-in fade-in slide-in-from-bottom-2 duration-500'>
                                                     <div className='flex items-center gap-2 mb-3 px-2'>
                                                        <div className='w-1 h-1 rounded-full bg-[#986a41]/50' />
                                                        <span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>
                                                            {group}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className='grid gap-3'>
                                                        {items.map((notif) => {
                                                            const isInvitation = invitationTypes.includes(notif.type)
                                                            const { icon: Icon, bgColor, iconColor } = getNotificationIcon(notif.type)
                                                            
                                                            return (
                                                                <motion.div
                                                                    key={notif._id}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    whileHover={{ scale: 1.01, y: -1 }}
                                                                    whileTap={{ scale: 0.99 }}
                                                                    onClick={() => handleNotificationClick(notif)}
                                                                    className={`relative overflow-hidden rounded-xl transition-all cursor-pointer group ${
                                                                        isInvitation 
                                                                            ? 'bg-white border border-[#986a41]/20 shadow-sm' // Invitation Style
                                                                            : notif.isRead 
                                                                                ? 'bg-white/60 border border-gray-100' // Read Style
                                                                                : 'bg-white border border-[#163146]/10 shadow-sm border-l-4 border-l-[#986a41]' // Unread General Style
                                                                    }`}
                                                                >
                                                                    {/* Special Background for Invites */}
                                                                    {isInvitation && (
                                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#986a41]/5 to-transparent rounded-bl-full -mr-4 -mt-4 pointer-events-none" />
                                                                    )}

                                                                    <div className='flex gap-4 p-4'>
                                                                        {/* Icon */}
                                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgColor} ${isInvitation ? 'ring-2 ring-white shadow-sm' : ''}`}>
                                                                            <Icon size={18} className={iconColor} />
                                                                        </div>
                                                                        
                                                                        {/* Content */}
                                                                        <div className='flex-1 min-w-0 pt-0.5 relative z-10'>
                                                                             {isInvitation && (
                                                                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#986a41]/10 text-[#986a41] mb-1.5 tracking-wide uppercase">
                                                                                    Pending Invitation
                                                                                </span>
                                                                             )}

                                                                            <div className='flex items-start justify-between gap-3'>
                                                                                <h4 className={`text-sm font-semibold leading-tight ${notif.isRead ? 'text-gray-700' : 'text-[#163146]'}`}>
                                                                                    {notif.title}
                                                                                </h4>
                                                                                <span className='text-[10px] text-gray-400 whitespace-nowrap font-medium'>
                                                                                    {formatTimestamp(notif.createdAt)}
                                                                                </span>
                                                                            </div>
                                                                            
                                                                            <p className='text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed'>
                                                                                {notif.description}
                                                                            </p>

                                                                            {/* Fake Action Buttons for Visuals (functionality is navigate for now) */}
                                                                            {isInvitation && (
                                                                                <div className="flex gap-2 mt-3">
                                                                                    <div className="flex-1 text-center py-1.5 bg-[#163146] text-white text-xs font-medium rounded-md shadow-sm hover:bg-[#0f1f27] transition-colors">
                                                                                        View Details
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Dismiss Action */}
                                                                     <button
                                                                        onClick={(e) => {
                                                                          e.stopPropagation()
                                                                          handleDeleteNotification(notif._id)
                                                                        }}
                                                                        className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all'
                                                                        title='Dismiss'
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </motion.div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })()
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
