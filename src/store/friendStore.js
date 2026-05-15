import { create } from 'zustand'
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getPendingFriendRequests,
  sendFriendRequest,
  unfriend,
} from '../services/friendService'

const normalizeFriend = (friend) => ({
  id: friend.id,
  displayName: friend.displayName || friend.name || friend.email || 'Unknown',
  email: friend.email || '',
  avatarUrl: friend.avatarUrl || friend.avatar || '',
  since: friend.since || friend.createdAt || null,
})

const normalizeRequest = (request) => ({
  id: request.id,
  sender: request.sender ? normalizeFriend(request.sender) : null,
  receiver: request.receiver ? normalizeFriend(request.receiver) : null,
  status: request.status || 'PENDING',
  createdAt: request.createdAt || null,
})

const useFriendStore = create((set, get) => ({
  friends: [],
  pendingRequests: [],
  isLoading: false,
  error: null,

  loadFriends: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await getFriends()
      const friends = Array.isArray(response?.data) ? response.data.map(normalizeFriend) : []
      set({ friends, isLoading: false })
      return friends
    } catch (error) {
      set({ error, isLoading: false })
      throw error
    }
  },

  loadPendingRequests: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await getPendingFriendRequests()
      const pendingRequests = Array.isArray(response?.data) ? response.data.map(normalizeRequest) : []
      set({ pendingRequests, isLoading: false })
      return pendingRequests
    } catch (error) {
      set({ error, isLoading: false })
      throw error
    }
  },

  refreshFriendData: async () => {
    await Promise.all([get().loadFriends(), get().loadPendingRequests()])
  },

  upsertPendingRequest: (request) => {
    const normalizedRequest = normalizeRequest(request)

    set((state) => {
      const existingIndex = state.pendingRequests.findIndex((item) => item.id === normalizedRequest.id)
      if (existingIndex >= 0) {
        const nextPendingRequests = [...state.pendingRequests]
        nextPendingRequests[existingIndex] = normalizedRequest
        return { pendingRequests: nextPendingRequests }
      }

      return {
        pendingRequests: [normalizedRequest, ...state.pendingRequests],
      }
    })
  },

  removePendingRequest: (requestId) => {
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((request) => request.id !== requestId),
    }))
  },

  addFriend: (friend) => {
    const normalizedFriend = normalizeFriend(friend)
    set((state) => ({
      friends: state.friends.some((item) => item.id === normalizedFriend.id)
        ? state.friends
        : [normalizedFriend, ...state.friends],
    }))
  },

  sendRequest: async (receiverId) => {
    const response = await sendFriendRequest(receiverId)
    return response
  },

  acceptRequest: async (requestId) => {
    const response = await acceptFriendRequest(requestId)
    const acceptedFriend = response?.data ? normalizeFriend(response.data) : null

    if (acceptedFriend) {
      set((state) => ({
        friends: state.friends.some((friend) => friend.id === acceptedFriend.id)
          ? state.friends
          : [acceptedFriend, ...state.friends],
        pendingRequests: state.pendingRequests.filter((request) => request.id !== requestId),
      }))
    }

    return response
  },

  declineRequest: async (requestId) => {
    const response = await declineFriendRequest(requestId)
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((request) => request.id !== requestId),
    }))
    return response
  },

  removeFriend: async (friendId) => {
    const response = await unfriend(friendId)
    set((state) => ({
      friends: state.friends.filter((friend) => friend.id !== friendId),
    }))
    return response
  },

  isFriend: (userId) => get().friends.some((friend) => friend.id === userId),
}))

export default useFriendStore
