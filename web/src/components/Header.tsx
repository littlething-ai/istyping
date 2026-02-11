interface HeaderProps {
  status: "disconnected" | "connected";
  roomId: string;
}

export const Header = ({ status, roomId }: HeaderProps) => (
  <div className="w-full flex justify-between items-center mb-4">
    <div>
      <h1 className="text-xl font-bold">Is Typing...</h1>
      {roomId ? (
        <div className="text-lg text-blue-400 font-black font-mono tracking-widest">
          {roomId}
        </div>
      ) : (
        <div className="text-xs text-gray-500 italic">Not Connected</div>
      )}
    </div>
    <div className={`px-2 py-1 rounded text-xs ${status === 'connected' ? 'bg-green-600' : 'bg-red-600'}`}>
      {status.toUpperCase()}
    </div>
  </div>
);
