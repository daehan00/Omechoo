import { Utensils, MapPin, Search } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <Utensils className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
          오메추
        </h1>
        <p className="text-gray-500 text-center mb-8">
          오늘 뭐 먹지? 고민을 해결해드려요.
        </p>

        <div className="space-y-4">
          <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300">
            <Search className="w-5 h-5" />
            메뉴 추천받기
          </button>
          
          <button className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-blue-500 text-gray-700 font-bold py-3 px-4 rounded-xl transition duration-300">
            <MapPin className="w-5 h-5 text-red-500" />
            근처 식당 찾기
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            https://github.com/daehan00
          </p>
        </div>
      </div>
    </div>
  )
}

export default App