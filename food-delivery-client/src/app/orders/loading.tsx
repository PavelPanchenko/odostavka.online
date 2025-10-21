/**
 * Loading state для страницы заказов
 */
export default function OrdersLoading() {
  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Orders List Skeleton */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-start space-x-3 mb-3">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
              <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

