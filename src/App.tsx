const mockData = [
  { id: 1, title: 'Morning Vibes', description: 'Start your day with positive energy', bgColor: 'bg-blue-500' },
  { id: 2, title: 'City Lights', description: 'Urban exploration at night', bgColor: 'bg-purple-600' },
  { id: 3, title: 'Ocean Waves', description: 'Relaxing beach sounds', bgColor: 'bg-cyan-500' },
  { id: 4, title: 'Mountain Peak', description: 'Reaching new heights', bgColor: 'bg-green-600' },
  { id: 5, title: 'Sunset Dreams', description: 'Golden hour magic', bgColor: 'bg-orange-500' },
  { id: 6, title: 'Neon Nights', description: 'Electric atmosphere', bgColor: 'bg-pink-600' },
  { id: 7, title: 'Forest Path', description: 'Nature walk serenity', bgColor: 'bg-emerald-600' },
  { id: 8, title: 'Desert Stars', description: 'Stargazing under clear skies', bgColor: 'bg-indigo-600' },
  { id: 9, title: 'Rain Drops', description: 'Cozy rainy day vibes', bgColor: 'bg-slate-600' },
  { id: 10, title: 'Fire Dance', description: 'Warmth and energy', bgColor: 'bg-red-600' }
];

function App() {
  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
      {mockData.map((item) => (
        <div
          key={item.id}
          className={`h-screen w-full snap-start flex flex-col items-center justify-center ${item.bgColor} text-white p-8`}
        >
          <h1 className="text-5xl font-bold mb-4">{item.title}</h1>
          <p className="text-xl text-center max-w-md">{item.description}</p>
          <div className="absolute bottom-8 text-sm opacity-70">
            Swipe up for more
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
