export default function Messages() {
  return (
    <div className="flex w-full h-screen border border-md rounded-md">
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center px-6">
            <p className="text-lg font-medium mb-2">No conversations yet</p>
            <p className="text-sm">Messages from learners will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
