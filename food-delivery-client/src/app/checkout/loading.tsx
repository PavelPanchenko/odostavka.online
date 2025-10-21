/**
 * Loading state для страницы оформления заказа
 */
export default function CheckoutLoading() {
  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Form Skeleton */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          {/* Form fields */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3 animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
          ))}

          {/* Button */}
          <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

