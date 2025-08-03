import { useAuth, useUser } from '@clerk/clerk-react'
import React, { useEffect, useState } from 'react'
import { Heart, Loader2, Image as ImageIcon } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Community = () => {
  const [creations, setCreations] = useState([])
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [likeLoading, setLikeLoading] = useState({})
  const { getToken } = useAuth()

  const fetchCreations = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/user/get-published-creations', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      
      if (data.success) {
        setCreations(data.creations || [])
      } else {
        toast.error(data.message || 'Failed to fetch creations')
      }
    } catch (error) {
      console.error('Fetch creations error:', error)
      toast.error(error.response?.data?.message || 'Failed to load creations')
    } finally {
      setLoading(false)
    }
  }

  const imageLikeToggle = async (id) => {
    try {
      const { data } = await axios.post('/api/user/toggle-like-creations', { creationId: id }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        toast.success(data.message)
        await fetchCreations()
      } else {
        toast.error(data.message)
      }
    } catch (error) { 
      toast.error(error.response?.data?.message || 'Failed to update like')
    }
  }

  useEffect(() => {
    if (user) {
      fetchCreations()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex-1 h-full flex flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold text-gray-800">Community Creations</h1>
        <div className="bg-white h-full w-full rounded-xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Loading community creations...</p>
          </div>
        </div>
      </div>
    )
  }

  return !loading ?(
    <div className="flex-1 h-full flex flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-gray-800">Community Creations</h1>
      
      <div className="bg-white h-full w-full rounded-xl overflow-y-auto">
        {creations.length === 0 ? (
          
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No creations yet</h3>
              <p className="text-gray-500">Be the first to share your creation with the community!</p>
            </div>
          </div>
        ) : (
        


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {creations.map((creation, index) => {
              
              const likes = creation.likes || []
              const isLiked = user?.id ? likes.includes(user.id) : false
              const likesCount = likes.length

              return (
                <div
                  key={creation.id || index}
                  className="relative group w-full h-64 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* Image */}
                  <img
                    src={creation.content}
                    alt={creation.prompt || 'AI Generated Creation'}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  
                  
                  <div 
                    className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg hidden"
                  >
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Image not available</p>
                    </div>
                  </div>

                
                  <div className="absolute inset-0 flex flex-col justify-end gap-2 p-3 bg-gradient-to-b from-transparent via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
                    <p className="text-sm line-clamp-2 break-words">
                      {creation.prompt || 'No description available'}
                    </p>
                    
                    <div className="flex gap-1 items-center justify-end">
                      <span className="text-sm font-medium">{likesCount}</span>
                     
                      <button
                        onClick={() => imageLikeToggle(creation.id)}
                        disabled={likeLoading[creation.id] || !user?.id}
                        className="disabled:cursor-not-allowed focus:outline-none"
                        title={user?.id ? (isLiked ? 'Unlike' : 'Like') : 'Login to like'}
                      >
                        {likeLoading[creation.id] ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <Heart
                            className={`w-5 h-5 hover:scale-110 transition-transform duration-200 ${
                              isLiked
                                ? 'fill-red-500 text-red-500'
                                : 'text-white hover:text-red-300'
                            } ${!user?.id ? 'opacity-50' : 'cursor-pointer'}`}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  ):(
    <div className='flex justify-center items-center h-full'>
      <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin'></span>
    </div>
  )
}

export default Community