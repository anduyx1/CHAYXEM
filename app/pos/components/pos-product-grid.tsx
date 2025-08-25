"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import Image from "next/image"
import type { Product } from "@/lib/types/database"
import { formatPrice } from "@/lib/utils"

interface PosProductGridProps {
  products: Product[]
  searchTerm: string
  currentPage: number
  totalPages: number
  productsPerPage: number
  onNextPage: () => void
  onPrevPage: () => void
  onAddToCart: (product: Product) => void
  onShowQuickServiceModal: () => void
  onClearCart: () => void
  onFocusDiscountInput: () => void
  onNavigateToOrders: () => void
  onNavigateToReports: () => void
  filteredProductsCount: number
  // Đã thêm prop để nhận biết tab đang hoạt động từ component cha
  activeTab: string
  onTabChange: (value: string) => void
}

export default function PosProductGrid({
  products,
  searchTerm,
  currentPage,
  totalPages,
  productsPerPage,
  onNextPage,
  onPrevPage,
  onAddToCart,
  onShowQuickServiceModal,
  onClearCart,
  onFocusDiscountInput,
  onNavigateToOrders,
  onNavigateToReports,
  filteredProductsCount,
  activeTab,
  onTabChange,
}: PosProductGridProps) {
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct)

  return (
    <div className="h-[35vh] flex-none bg-white border-t border-gray-200">
      {/* Đã thêm onValueChange và bỏ defaultValue để quản lý tab từ state cha */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="quick" className="text-xs py-1">
              Thao tác nhanh
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs py-1">
              Danh sách sản phẩm
            </TabsTrigger>
          </TabsList>
          {/* Đã gộp thông tin Hotline và Phân trang vào một flex container */}
          <div className="flex items-center space-x-4">
            {activeTab === "products" && ( // Hiển thị phân trang chỉ khi tab "Sản phẩm" active
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0 bg-transparent"
                  onClick={onPrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0 bg-transparent"
                  onClick={onNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
                <span className="text-xs text-gray-500">
                  Trang {currentPage}/{totalPages}
                </span>
              </div>
            )}
            <div className="text-xs text-gray-500">
              {"Hotline hỗ trợ: 0963.88.1993 📞 | Tìm thấy: "}
              {filteredProductsCount}
              {" sản phẩm"}
            </div>
          </div>
        </div>
        <TabsContent value="quick" className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="bg-black text-white" onClick={onShowQuickServiceModal}>
              Thêm dịch vụ (F9)
            </Button>
            <Button variant="outline" className="bg-black text-white" onClick={onFocusDiscountInput}>
              Chiết khấu đơn (F6)
            </Button>
            <Button variant="outline" className="bg-black text-white">
              Khuyến mại (F8)
            </Button>
            <Button variant="outline" className="bg-black text-white">
              Đổi quà
            </Button>
            <Button variant="outline" className="bg-black text-white">
              Thiết lập chung
            </Button>
            <Button variant="outline" className="bg-black text-white">
              Đổi giá bán hàng
            </Button>
            <Button variant="outline" className="bg-black text-white">
              Thông tin khách hàng
            </Button>
            <Button variant="outline" className="bg-black text-white" onClick={onClearCart}>
              Xóa toàn bộ sản phẩm
            </Button>
            <Button variant="outline" className="bg-black text-white">
              Đổi trả hàng
            </Button>
            <Button variant="outline" className="bg-black text-white" onClick={onNavigateToOrders}>
              Xem danh sách đơn hàng
            </Button>
            <Button variant="outline" className="bg-black text-white" onClick={onNavigateToReports}>
              Xem báo cáo
            </Button>
            <Button variant="outline" className="bg-black text-white">
              Tất cả thao tác
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="products" className="flex-1 overflow-y-auto p-2">
          {/* Đã giảm gap xuống 0.5 */}
          <div className="grid grid-cols-11 gap-0.5">
            {currentProducts.map((product) => (
              <Card
                key={product.id}
                className={`cursor-pointer hover:shadow-md transition-shadow border border-gray-200 aspect-square`}
                // Đã loại bỏ logic ngăn chặn, luôn cho phép click và xử lý cảnh báo trong hàm onAddToCart
                onClick={() => onAddToCart(product)}
              >
                <CardContent className="p-0 h-full">
                  <div className="relative w-full h-full bg-gray-100 rounded border overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-600">{product.name.charAt(0)}</span>
                      </div>
                    )}
                    {/* Thêm nhãn "Hết hàng" nếu sản phẩm hết tồn kho và không phải là dịch vụ */}
                    {product.stock_quantity <= 0 && !product.isService && (
                      <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded-br-lg z-10">
                        Hết hàng
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-2">
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-yellow-300 drop-shadow-sm">
                          {formatPrice(product.wholesale_price)}
                        </div>
                        <div className="flex justify-between items-baseline text-[10px] text-white drop-shadow-sm">
                          {(product.sku || product.barcode) && (
                            <span>{product.sku ? `SKU: ${product.sku}` : `Barcode: ${product.barcode}`}</span>
                          )}
                          <span>{product.isService ? "Dịch vụ" : `SL: ${product.stock_quantity}`}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {searchTerm && filteredProductsCount === 0 && (
            <div className="text-center py-4 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">
                {'Không tìm thấy sản phẩm với từ khóa: "'}
                {searchTerm}
                {'"'}
              </p>
              <p className="text-xs mt-1">Thử tìm kiếm bằng mã SKU hoặc tên sản phẩm khác</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
