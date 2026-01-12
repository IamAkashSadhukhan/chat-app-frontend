import React, { useState } from "react";
import toast from "react-hot-toast";
import { createRoom, joinChatApi } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
const JoinCreateChat = () => {
  const [detail, setDetail] = useState({
    roomId: "",
    userName: "",
  });
  const navigate = useNavigate();
  const {roomId, currentUser,connected, setRoomId, setCurrentUser, setConnected}=useChatContext();

  function handelFormInputChange(event) {
    setDetail({
      ...detail,
      [event.target.name]: event.target.value,
    });
  }
  function validateForm() {
    if (detail.roomId === "" || detail.userName === "") {
      toast.error("please enter Room Id and User Name");
      return false;
    }
    return true;
  }
  async function joinChat() {
    if (!validateForm()) return;
    console.log("Joining room", detail);
    try {
     const room = await joinChatApi(detail.roomId);
     //console.log(room);
     toast.success("Joined....");
      setCurrentUser(detail.userName);
      setRoomId(room.roomid);
      setConnected(true);
      navigate("/chat")
    } catch (error) {
      if (error.status === 400) {
          toast.error("RoomId not exists");
        } else {
          toast.error("Error in creating room");
          console.log(error)
        }
    }

  }
  async function CreateRoom() {
    if (validateForm()) {
      console.log(detail);
      try {
        const response = await createRoom(detail.roomId);
        //console.log(response);
        toast.success("Room created successfully");
        //join the chat
        setCurrentUser(detail.userName);
        setRoomId(detail.roomId);
       setConnected(true);
        //forward to chat page..
        navigate("/chat")
      } catch (error) {
        console.log(error);
        if (error.status === 400) {
          toast.error("RoomId alreeady exists");
        } else {
          toast.error("Error in creating room");
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card  p-8 w-full max-w-md rounded flex flex-col gap-5 shadow">
        <h1 className="text-2xl font-semibold text-center">
          Join Room/Create Room
        </h1>
        <div className="name">
          <label htmlFor="name" className="block font-medium mb-2">
            Your name
          </label>
          <input
            onChange={handelFormInputChange}
            value={detail.userName}
            placeholder="Enter user name"
            type="text"
            id="name"
            name="userName"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="roomId">
          <label htmlFor="name" className="block font-medium mb-2">
            Room Id/New Room Id
          </label>
          <input
            name="roomId"
            onChange={handelFormInputChange}
            placeholder="Enter the room id"
            value={detail.roomId}
            type="text"
            id="name"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={joinChat}
            className="px-3 py-2 rounded hover:bg-blue-800 bg-blue-500"
          >
            Join Room
          </button>
          <button
            onClick={CreateRoom}
            className="px-3 py-2 rounded hover:bg-orange-800 bg-orange-500"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinCreateChat;
