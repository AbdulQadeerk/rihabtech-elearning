import { useState } from 'react';
import { Send, Mic, Check, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';

// Sample chat data
const initialChats = [
  {
    id: 1,
    sender: 'Manas',
    time: '3:00 PM',
    message: 'Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s.',
    isAdmin: true,
    status: 'Espera',
    messageType: 'Assigment'
  },
  {
    id: 2,
    sender: 'Manas',
    time: '3:00 PM',
    message: 'Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s.',
    isAdmin: true,
    status: 'Atendimento',
    messageType: 'Assigment'
  },
  {
    id: 3,
    sender: 'Manas',
    time: '3:01 PM',
    message: 'Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s.',
    isAdmin: true,
    status: 'Espera',
    messageType: 'Assigment'
  },
  {
    id: 4,
    sender: 'Manas',
    time: '3:07 PM',
    message: 'Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s.',
    isAdmin: true,
    status: 'Atendimento',
    messageType: 'Assigment'
  },
  {
    id: 5,
    sender: 'Manas',
    time: '3:01 PM',
    message: 'Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s.',
    isAdmin: true,
    status: 'Espera',
    messageType: 'Assigment'
  },
  {
    id: 6,
    sender: 'Manas',
    time: '3:01 PM',
    message: 'Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s.',
    isAdmin: true,
    status: 'Espera',
    messageType: 'Assigment'
  }
];

// Sample conversation messages
const initialMessages = [
  {
    id: 1,
    sender: 'Manas',
    message: 'Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s.',
    time: '3:00 PM'
  },
  {
    id: 2,
    sender: 'user',
    message: 'Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s.',
    time: '3:05 PM'
  },
  {
    id: 3,
    sender: 'admin',
    message: 'Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s.',
    time: '3:10 PM'
  },
  {
    id: 4,
    sender: 'user',
    message: 'Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s.',
    time: '3:20 PM'
  }
];

const AdminAvatar = () => (
  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
    <img src="Images/users/team-18.jpg.jpg" alt="Admin" className="w-full h-full object-cover" />
  </div>
);

const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white">
    <span className="text-sm font-semibold">MA</span>
  </div>
);

export default function Messages() {
  const [activeChat, setActiveChat] = useState(0);
  const [message, setMessage] = useState('');
  const [chats] = useState(initialChats);
  const [messages] = useState(initialMessages);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Logic to send message would go here
      setMessage('');
    }
  };

  return (
    <div className="flex w-full h-screen border border-md rounded-md">
      

      {/* Main Content */}
      <div className="flex w-full">
        {/* Left sidebar - Chat list */}
        <div className="w-1/3 border-r border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Messeges</h2>
            <div className="mt-4 flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Pesquisar chat"
                  className="w-full pl-8 pr-4 py-2 outline outline-2 outline-gray-300 bg-white rounded-[10px]"
                />
                <div className="absolute inset-y-0 left-2 flex items-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
             <Button variant={'link'}>CHAT <Plus/></Button>
            </div>
          </div>

          <div className="overflow-y-auto h-full max-h-[calc(100vh-12rem)]">
            {chats.map((chat, index) => (
              <div
                key={chat.id}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 rounded-[10px] border border-[#dfe0eb] shadow-[0px_0px_8px_0px_rgba(255,119,0,0.29)] mb-1 ${
                  activeChat === index ? 'bg-gray-50' : ''
                }`}
                onClick={() => setActiveChat(index)}
              >
                <UserAvatar />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <div className='flex flex-col justify-between'>
                    <p className="text-black text-sm font-semibold font-['Public_Sans']">{chat.sender}</p>
                    <p className="text-xs text-gray-500">{chat.messageType}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      {/* <span className={`inline-block px-2 text-xs rounded-full text-black text-xs font-normal font-['Public_Sans']
                      }`}>
                        {chat.status}
                      </span> */}
                      <span className="ml-auto bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          10
        </span>
                      <p className="text-xs text-gray-500">{chat.time}</p>
                    </div>
                  {/* <span className="text-primary">▶</span> */}
                  </div>
                  
                  
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Chat conversation */}
        <div className="w-2/3 flex flex-col bg-white">
          {/* Chat header */}
          <div className="p-4 border-b border-gray-200 flex items-center">
            <AdminAvatar />
            <div className="ml-3">
              <p className="font-semibold">Manas</p>
              <p className="text-xs text-gray-500">#23765891</p>
            </div>
            <div className="ml-auto">
              <span className="text-primary font-bold">●</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex items-center space-x-2 max-w-md">
                    {msg.sender === 'admin' && <UserAvatar />}
                    <div className='flex flex-col gap-2'>
                    <div 
                      className={`px-4 py-2 rounded-lg text-sm ${
                        msg.sender === 'user' 
                          ? 'bg-primary text-white rounded-br-none' 
                          : 'bg-white rounded-[10px] border border-primary text-primary rounded-bl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <div className=" text-[#333333] text-[10px] font-normal font-['Public_Sans']">8:00 PM</div>
                    </div>
                    {msg.sender === 'user' && <AdminAvatar />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-1 border border-primary bg-white rounded-[10px] p-2 flex items-center">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 outline-none border-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <div className="flex items-center space-x-2">
                <button 
                    className="text-primary hover:text-gray-700"
                    onClick={() => {/* Logic for microphone */}}
                  >
                    <img src='Images/icons/attach-file.png' className='h-6 w-6'/>
                    {/* <Mic size={20} /> */}
                  </button>
                  <button 
                    className="text-primary hover:text-gray-700"
                    onClick={() => {/* Logic for microphone */}}
                  >
                    <img src='Images/icons/check.png' className='h-6 w-6'/>
                    {/* <Mic size={20} /> */}
                  </button>
                  <Button 
                    className={`p-1.5 ${message.trim() ? 'bg-primary text-white' : 'bg-primary text-gray-500'}`}
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                  >
                    <img src='Images/icons/send.png' className='h-6 w-6'/>
                    {/* <Send size={16} color='white'/> */}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}