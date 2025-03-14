import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import axios from "axios";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      console.log(res.data);

      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      const newMessage = {
        ...res.data,
        createdAt: res.data.createAt || new Date().toISOString(),
      };
      set({ messages: [...messages, newMessage] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: (userId) => {
    const { selectedUser } = get();
    if (!selectedUser) {
      return;
    }

    const socket = useAuthStore.getState().socket;

    // todo: optimize this one later
    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) {
        return;
      }
      set({ messages: [...get().messages, newMessage] });
    });
  },

  unscubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  //   todo optimize this one later
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
