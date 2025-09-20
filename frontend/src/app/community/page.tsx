"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import api from "@/utils/axios";

// Define the shape of a user for type safety.
interface User {
  fullName: {
    firstName: string;
    lastName: string;
  };
  profilePic: string;
}

// Define the shape of a comment.
interface Comment {
  text: string;
}

// Define the shape of a post.
interface Post {
  id: number;
  name: string;
  profilePic: string;
  text: string;
  image?: string;
  likes: number;
  liked?: boolean;
  comments: Comment[];
}

// Define the shape of a message in a peer group.
interface Message {
  id: number;
  text: string;
  group: string | null; // Group can be null
}

// Define the shape of an event row's props.
interface EventRowProps {
  date: string;
  name: string;
  type: string;
}

const eventRows = [
  { date: "2025-09-25", name: "Web3 Credentials Workshop", type: "Workshop" },
  { date: "2025-10-02", name: "Next.js Training", type: "Training" },
  { date: "2025-10-10", name: "Digital Badges Webinar", type: "Webinar" },
];

function EventRow({ date, name, type }: EventRowProps) {
  const [rsvp, setRsvp] = useState<boolean>(false);
  const [reminder, setReminder] = useState<boolean>(false);
  return (
    <tr className="border-b">
      <td className="p-2">{date}</td>
      <td className="p-2 font-semibold">{name}</td>
      <td className="p-2">{type}</td>
      <td className="p-2">
        <button
          className={`px-3 py-1 rounded ${
            rsvp ? "bg-green-500 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
          onClick={() => setRsvp(!rsvp)}
        >
          {rsvp ? "Registered" : "RSVP"}
        </button>
      </td>
      <td className="p-2">
        <button
          className={`px-3 py-1 rounded ${
            reminder ? "bg-purple-500 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
          onClick={() => setReminder(!reminder)}
        >
          {reminder ? "Reminder Set" : "Set Reminder"}
        </button>
      </td>
    </tr>
  );
}

export default function CommunityPage() {
  const [section, setSection] = useState<string>("discussion");
  // Discussion Section
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState<string>("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);

  useEffect(() => {
    // Fetch user info from backend
    const token = localStorage.getItem("authToken");
    if (!token) return;
    api.get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const [commentText, setCommentText] = useState<string>("");

  const handlePost = () => {
    if (text.trim() === "" && !image) return;
    setPosts([
      {
        id: Date.now(),
        name: user?.fullName ? `${user.fullName.firstName} ${user.fullName.lastName}` : "Anonymous",
        profilePic: user?.profilePic || `/images/default-profile.png`,
        text,
        image,
        likes: 0,
        comments: [],
      },
      ...posts,
    ]);
    setText("");
    setImage(undefined);
  };
  
  const handleLike = (id: number) => {
    setPosts(posts.map(post => post.id === id ? { ...post, likes: post.likes + 1, liked: true } : post));
  };
  
  const handleComment = (id: number) => {
    if (commentText.trim() === "") return;
    setPosts(posts.map(post => post.id === id ? { ...post, comments: [...post.comments, { text: commentText }] } : post));
    setCommentText("");
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Peer Groups Section
  interface Field {
    name: string;
    img: string;
  }
  const fields: Field[] = [
    { name: "Cybersecurity", img: "/images/cybersecurity.png" },
    { name: "Blockchain", img: "/images/blockchain.png" },
    { name: "AI", img: "/images/ai.png" },
    { name: "Web Development", img: "/images/webdev.png" },
    { name: "Data Science", img: "/images/datascience.png" },
    { name: "Cloud Computing", img: "/images/cloud.png" },
    { name: "IoT", img: "/images/iot.png" },
    { name: "DevOps", img: "/images/devops.png" },
    { name: "UI/UX Design", img: "/images/uiux.png" },
    { name: "Mobile Development", img: "/images/mobile.png" },
  ];
  const [joinedGroup, setJoinedGroup] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");

  const handleSend = () => {
    if (input.trim() === "") return;
    setMessages([
      ...messages,
      { id: Date.now(), text: input, group: joinedGroup },
    ]);
    setInput("");
  };

  return (
    <main className="p-4 bg-white min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Community</h1>
        <nav className="mb-6 flex justify-center gap-2 border-b pb-2">
          {[
            { key: "discussion", label: "Discussion" },
            { key: "peer-groups", label: "Peer Groups" },
            { key: "events", label: "Events" },
            { key: "gamification", label: "Gamification" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSection(tab.key)}
              className={`px-4 py-1 rounded font-medium transition-all duration-150 ${
                section === tab.key ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {section === "discussion" && (
          <div className="mb-10 bg-white rounded-xl shadow p-4 border border-blue-100">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Discussion</h2>
            <div className="flex flex-col gap-2 mb-4">
              <textarea
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2 resize-none"
                rows={2}
                placeholder="Share your thoughts..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
              <button
                className="bg-blue-600 text-white px-4 py-1 rounded font-bold shadow hover:bg-blue-700 transition"
                onClick={handlePost}
              >
                Post
              </button>
            </div>
            <div className="mt-6">
              {posts.length === 0 ? (
                <p className="text-gray-400 text-center">No posts yet.</p>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="mb-4 bg-white rounded-lg p-3 border border-gray-200 shadow flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" fill="#bdbdbd" />
                        <rect x="4" y="16" width="16" height="6" rx="3" fill="#bdbdbd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-blue-700 text-sm">{post.name}</span>
                      </div>
                      <p className="mb-2 text-gray-800 text-sm">{post.text}</p>
                      {post.image && (
                        <img src={post.image} alt="Post" className="max-w-xs mb-2 rounded-lg border" />
                      )}
                      <div className="flex gap-2 mt-2 items-center">
                        <button
                          className={`w-6 h-6 flex items-center justify-center rounded transition ${
                            post.liked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          onClick={() => handleLike(post.id)}
                          title="Like"
                          style={{ border: 'none', outline: 'none', position: 'relative' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M6.5 14V7.5L10.5 2.5C10.5 2.5 11.5 2.5 11.5 4.5C11.5 6.5 9.5 7.5 9.5 7.5H13C13.5 7.5 14 8 14 8.5V13C14 13.5 13.5 14 13 14H6.5Z"
                              stroke={post.liked ? '#2563eb' : '#222'}
                              strokeWidth="1.2"
                              fill={post.liked ? '#2563eb' : 'white'}
                            />
                          </svg>
                        </button>
                        <span className="ml-1 text-xs font-semibold" style={{ color: post.liked ? '#2563eb' : '#222' }}>{post.likes}</span>
                        <span className="ml-3"></span>
                        <button
                          className="w-6 h-6 flex items-center justify-center rounded transition bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300 shadow-sm"
                          onClick={e => {
                            e.preventDefault();
                            setActiveCommentId(activeCommentId === post.id ? null : post.id);
                          }}
                          title="Comment"
                          style={{ outline: 'none' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="4" width="12" height="8" rx="2" stroke="#222" strokeWidth="1.2" fill="white" />
                          </svg>
                        </button>
                        <span className="ml-1 text-xs font-semibold" style={{ color: '#222' }}>{post.comments.length}</span>
                      </div>
                      {activeCommentId === post.id && (
                        <div className="flex flex-col gap-2 mt-2 p-2 rounded" style={{ maxHeight: '120px', overflowY: 'auto', background: '#f6f6f6' }}>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              className="border rounded px-2 py-1 text-xs flex-1"
                              placeholder="Add a comment..."
                              value={commentText}
                              onChange={e => setCommentText(e.target.value)}
                            />
                            <button
                              className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition"
                              onClick={() => { handleComment(post.id); }}
                            >
                              Comment
                            </button>
                          </div>
                          <div className="mt-2 ml-2" style={{ maxHeight: '70px', overflowY: 'auto' }}>
                            {post.comments.length > 0 ? post.comments.map((c, idx) => (
                              <div key={idx} className="text-gray-700 text-xs mb-1">{c.text}</div>
                            )) : <span className="text-gray-400 text-xs">No comments yet.</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {section === "peer-groups" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-10 border border-blue-100">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Peer Groups</h2>
            {!joinedGroup && (
              <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-center">
                {fields.map((field) => (
                  <button
                    key={field.name}
                    className="flex flex-col items-center justify-center w-40 h-40 rounded-xl border-2 font-semibold transition-colors shadow-lg bg-white hover:bg-blue-50 border-gray-200"
                    onClick={() => setJoinedGroup(field.name)}
                  >
                    <img src={field.img} alt={field.name} className="w-16 h-16 mb-3 object-contain" />
                    <span className="text-lg font-bold text-blue-700">{field.name}</span>
                  </button>
                ))}
              </div>
            )}
            {joinedGroup && (
              <div className="bg-white rounded-xl shadow p-4 border border-blue-100">
                <button
                  className="mb-3 px-3 py-1 bg-blue-100 text-blue-700 rounded font-medium shadow hover:bg-blue-200 transition"
                  onClick={() => setJoinedGroup(null)}
                >
                  ← Back
                </button>
                <h3 className="text-lg font-semibold mb-2 text-blue-700">{joinedGroup} Group Chat</h3>
                <div className="mb-4 max-h-56 overflow-y-auto flex flex-col gap-2">
                  {messages.filter(m => m.group === joinedGroup).length === 0 ? (
                    <p className="text-gray-400 text-center">No messages yet. Start the conversation!</p>
                  ) : (
                    messages.filter(m => m.group === joinedGroup).map(m => (
                      <div key={m.id} className="self-start max-w-xs bg-blue-50 rounded-lg px-4 py-2 border border-blue-200 text-gray-800 shadow-sm">
                        {m.text}
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 items-center mt-2">
                  <input
                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    type="text"
                    placeholder="Type your message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                  />
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                    onClick={handleSend}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {section === "events" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-10 border border-blue-100">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Events</h2>
            <div className="mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="p-2">Date</th>
                    <th className="p-2">Event</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">RSVP</th>
                    <th className="p-2">Reminder</th>
                  </tr>
                </thead>
                <tbody>
                  {eventRows.map((props, idx) => <EventRow key={idx} {...props} />)}
                </tbody>
              </table>
            </div>
            <div className="text-gray-500 text-center">Click RSVP to register and set a reminder for upcoming events!</div>
          </div>
        )}
        {section === "gamification" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-10 border border-purple-200">
            <h2 className="text-2xl font-bold mb-4 text-purple-700">Gamification & Recognition</h2>
            <div className="mb-8 flex flex-wrap gap-6 justify-center">
              <div className="flex flex-col items-center">
                <span className="inline-block bg-yellow-400 text-white px-4 py-2 rounded-full font-bold mb-2 shadow">🏅 Top Contributor</span>
                <span className="text-gray-700">Awarded for most posts & likes</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="inline-block bg-blue-400 text-white px-4 py-2 rounded-full font-bold mb-2 shadow">🎓 Skill Mentor</span>
                <span className="text-gray-700">Awarded for helping others</span>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-purple-700">Leaderboard</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-purple-100">
                    <th className="p-2">Rank</th>
                    <th className="p-2">User</th>
                    <th className="p-2">Points</th>
                    <th className="p-2">Badge</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-bold">1</td>
                    <td className="p-2">Alice</td>
                    <td className="p-2">1200</td>
                    <td className="p-2">🏅 Top Contributor</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-bold">2</td>
                    <td className="p-2">Bob</td>
                    <td className="p-2">950</td>
                    <td className="p-2">🎓 Skill Mentor</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">3</td>
                    <td className="p-2">Charlie</td>
                    <td className="p-2">800</td>
                    <td className="p-2">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-gray-500 text-center">Earn badges and points by posting, commenting, and helping others!</div>
          </div>
        )}
      </div>
    </main>
  );
}
