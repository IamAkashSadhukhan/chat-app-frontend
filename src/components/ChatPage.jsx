import React, { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { MdAttachment } from "react-icons/md";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
import { baseUrl } from "../config/AxiosHelper";
import SockJS from "sockjs-client";
import { Client, Stomp } from "@stomp/stompjs";
import toast from "react-hot-toast";
import { getMessages } from "../services/RoomService";
import EmojiPicker from "emoji-picker-react";
import { BsEmojiSmile } from "react-icons/bs";

const ChatPage = () => {
  const fileInputRef = useRef(null);
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    await uploadFile(file);
    e.target.value = "";
  };
  const uploadFile = async (file) => {
    if (!stompClient || !connected) {
      toast.error("Not connected");
      return;
    }

    toast.loading("Uploading file...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", roomId);
    formData.append("sender", currentUser);

    try {
      const res = await fetch(`${baseUrl}/api/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        toast.dismiss();
        toast.error("Upload failed: " + errorText);
        return;
      }

      const data = await res.json();

      stompClient.send(
        `/app/sendMessage/${roomId}`,
        {},
        JSON.stringify({
          sender: currentUser,
          content: data.fileUrl,
          type: "FILE",
          fileName: data.fileName,
        })
      );

      toast.dismiss();
      toast.success("File sent");
    } catch (err) {
      toast.dismiss();
      toast.error("Network / server error");
      console.error(err);
    }
  };

  const [showEmoji, setShowEmoji] = useState(false);
  const onEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const formatChatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();

    const isSameDay = (d1, d2) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";

    const diffYear = date.getFullYear() !== today.getFullYear();

    return date.toLocaleDateString("en-IN", {
      weekday: diffYear ? undefined : "long",
      day: "2-digit",
      month: "short",
      year: diffYear ? "numeric" : undefined,
    });
  };
  const senderColors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-rose-500",
  ];

  const getColorForSender = (sender) => {
    if (!sender) return "bg-gray-400";

    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      hash = sender.charCodeAt(i) + ((hash << 5) - hash);
    }

    return senderColors[Math.abs(hash) % senderColors.length];
  };

  const {
    roomId,
    currentUser,
    connected,
    setRoomId,
    setCurrentUser,
    setConnected,
  } = useChatContext();
  //const [currentUser, setcurrentUser] = useState("Durgesh");
  // console.log(roomId);
  // console.log(currentUser);
  // console.log(connected);
  const navigate = useNavigate();
  useEffect(() => {
    if (!connected) navigate("/");
  }, [connected, roomId, currentUser]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const inputRef = useRef(null);
  const chatBoxref = useRef(null);

  const [stompClient, setStompClient] = useState(null);
  //const [roomId, setRoomId] = useState("");

  //page init per message ko load karne honge
  useEffect(() => {
    if (!roomId) return; // ⛔ DO NOT CALL API if roomId empty

    async function loadMessages() {
      try {
        const response = await getMessages(roomId);
        setMessages(response.data);

        console.log(response);
      } catch (error) {
        console.log(error);
      }
    }

    loadMessages();
  }, [roomId]);
  //stompClient ko init karne and subscribe karne honge
  useEffect(() => {
    if (!connected || stompClient) return;

    const sock = new SockJS(`${baseUrl}/chat`);
    const client = Stomp.over(sock);

    client.connect({}, () => {
      setStompClient(client);
      toast.success("connected");

      client.subscribe(`/topic/room/${roomId}`, (message) => {
        const newMessage = JSON.parse(message.body);
        setMessages((prev) => [...prev, newMessage]);
      });
    });

    return () => {
      if (client.connected) {
        client.disconnect();
      }
    };
  }, [connected, roomId]);

  //send message handel
  const sendMessage = async () => {
    if (stompClient && connected && input.trim()) {
      console.log(input);
      const message = {
        sender: currentUser,
        content: input,
        roomId: roomId,
      };

      stompClient.send(
        `/app/sendMessage/${roomId}`,
        {},
        JSON.stringify(message)
      );
      setInput("");
    }
  };
  useEffect(() => {
    if (chatBoxref.current) {
      chatBoxref.current.scroll({
        top: chatBoxref.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);
  const handelLogOut = () => {
    stompClient.disconnect();
    setConnected(false);
    setRoomId("");
    setCurrentUser("");
    navigate("/");
  };

  return (
    <div className="overflow-y-hidden">
      <header className="flex  shadow justify-around py-5 items-center fix w-full h-20 fixed bg-gray-50 ">
        <div>
          <h1 className="text-xl font-semibold">
            Room : <span>{roomId}</span>
          </h1>
        </div>
        <div>
          <h1 className="text-xl font-semibold">
            User : <span>{currentUser}</span>
          </h1>
        </div>
        <div>
          <button
            onClick={handelLogOut}
            className="bg-red-500 hover:bg-red-700 px-3 py-2 rounded-full "
          >
            Leave Room
          </button>
        </div>
      </header>
      {/* <main
        ref={chatBoxref}
        className="px-10 py-20  w-2/3 h-screen overflow-auto mx-auto bg-gray-600 "
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === currentUser ? "justify-end" : "justify-start"
            }`}
          >
            <div className={`my-2 bg-blue-600 p-2 w-xs rounded`}>
              <div className="flex flex-row gap-3">
                <img
                  className="h-10 w-10 rounded-full"
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXZhdGFyfGVufDB8fDB8fHww"
                  alt=""
                />
                <div className="borer flex flex-col gap-1">
                  <p className="text-sm font-bold">{message.sender}</p>

                  <p>{message.content}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </main> */}
      <main
        ref={chatBoxref}
        className="
    px-3 sm:px-6
    py-24
    w-full sm:w-4/5 lg:w-2/3
    h-screen
    overflow-auto
    mx-auto
    bg-gray-100
  "
      >
        {messages.map((message, index) => {
          const isMe = message.sender === currentUser;

          const currentDateLabel = formatChatDate(message.timestamp);
          const prevDateLabel =
            index > 0 ? formatChatDate(messages[index - 1].timestamp) : null;

          const bubbleColor = isMe
            ? "bg-green-500 text-white"
            : `${getColorForSender(message.sender)} text-white`;

          // ✅ FIX: detect file for both OLD + NEW messages
          const isFile =
            message.type === "FILE" ||
            (typeof message.content === "string" &&
              message.content.startsWith("/uploads/"));

          const isImage =
            isFile && message.content.match(/\.(jpg|jpeg|png|gif)$/i);
          const isVideo =
            isFile && message.content.match(/\.(mp4|webm|ogg|mov)$/i);

          return (
            <React.Fragment key={index}>
              {/* DATE SEPARATOR */}
              {currentDateLabel !== prevDateLabel && (
                <div className="flex justify-center my-4">
                  <span className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded-full">
                    {currentDateLabel}
                  </span>
                </div>
              )}

              {/* MESSAGE ROW */}
              <div
                className={`flex mb-3 ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar (others) */}
                {!isMe && (
                  <img
                    className="h-9 w-9 rounded-full mr-2 self-end"
                    src="data:image/jpeg;base64,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"
                    alt="avatar"
                  />
                )}

                {/* MESSAGE BUBBLE */}
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl shadow
              ${bubbleColor}
              ${isMe ? "rounded-br-none" : "rounded-bl-none"}
            `}
                >
                  {/* Sender name (group chat style) */}
                  {!isMe && (
                    <p className="text-xs font-semibold opacity-80 mb-1">
                      {message.sender}
                    </p>
                  )}

                  {/* MESSAGE CONTENT */}
                  {isFile ? (
                    isImage ? (
                      /* IMAGE PREVIEW */
                      <img
                        src={`${baseUrl}${message.content}`}
                        className="
    w-full
    max-w-[260px] sm:max-w-xs
    rounded-lg
    mt-2
    object-contain
  "
                      />
                    ) : isVideo ? (
                      /* VIDEO PREVIEW */
                      <video
                        src={`${baseUrl}${message.content}`}
                        controls
                        preload="metadata"
                        className="
    w-full
    max-w-[260px] sm:max-w-xs
    max-h-[200px]
    object-contain
    rounded-lg
    mt-2
    bg-black
  "
                      />
                    ) : (
                      /* FILE CARD */
                      <div className="flex items-center gap-3 bg-white/20 p-3 rounded-xl mt-1">
                        <div className="text-3xl">📄</div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-semibold truncate">
                            {message.fileName ||
                              message.content.split("/").pop()}
                          </p>
                          <p className="text-xs opacity-80">Document</p>
                        </div>
                        <a
                          href={`${baseUrl}${message.content}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline"
                        >
                          Download
                        </a>
                      </div>
                    )
                  ) : (
                    <p className="text-sm break-words">{message.content}</p>
                  )}

                  {/* TIME */}
                  <p className="text-[10px] text-right opacity-80 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Avatar (you) */}
                {isMe && (
                  <img
                    className="h-9 w-9 rounded-full ml-2 self-end"
                    src="data:image/jpeg;base64,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"
                    alt="avatar"
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </main>

      {/* input message container */}
      <div className="fixed bottom-0 w-full bg-gray-50 pb-2">
        <div
          className="
      relative
      h-14
      w-full sm:w-4/5 lg:w-2/3
      mx-auto
      rounded-full
      flex
      items-center
      gap-2
      px-3
    "
        >
          {/* Emoji Picker */}
          {showEmoji && (
            <div className="absolute bottom-16 left-0 z-50 shadow-lg">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                height={350}
                width={300}
              />
            </div>
          )}

          {/* Emoji Button */}
          <button
            onClick={() => setShowEmoji((prev) => !prev)}
            className="text-gray-600 hover:text-yellow-500"
          >
            <BsEmojiSmile size={22} />
          </button>

          {/* Input */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
                setShowEmoji(false);
              }
            }}
            type="text"
            placeholder="Write a message"
            className="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {/* Attachment */}
          <button
            onClick={() => fileInputRef.current.click()}
            className="text-purple-600 hover:text-purple-800"
          >
            <MdAttachment size={22} />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            accept="*/*"
          />

          {/* Send */}
          <button
            onClick={() => {
              sendMessage();
              setShowEmoji(false);
            }}
            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full"
          >
            <IoSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
