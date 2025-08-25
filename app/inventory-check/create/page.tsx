"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Search, X } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  createInventoryCheckSession,
  addProductToCheck,
  updateProductActualStock,
  balanceInventory,
  getProductsWithPagination, // Import function mới
} from "@/lib/actions/inventory-check"

interface Product {
  id: string
  name: string
  code: string
  image?: string
  systemStock: number
  actualStock?: number
  difference?: number
  reason?: string
  status: "unchecked" | "matched" | "different"
}

interface ProductSearch {
  id: string
  name: string
  code: string
  sku: string
  barcode: string
  stock: number
  image_url: string
}

export default function CreateInventoryCheckPage() {
  const router = useRouter()
  const [checkInfo, setCheckInfo] = useState({
    branch: "main",
    staff: "dali",
    code: "",
    notes: "",
    tags: "",
  })

  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [isMultiSelectDialogOpen, setIsMultiSelectDialogOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<ProductSearch[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isBalancing, setIsBalancing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  const generateCode = () => {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
    const timeStr = now.getHours().toString().padStart(2, "0") + now.getMinutes().toString().padStart(2, "0")
    return `IAN${dateStr}${timeStr}`
  }

  useEffect(() => {
    setCheckInfo((prev) => ({ ...prev, code: generateCode() }))
  }, [])

  const loadProductsWithPagination = useCallback(async (page = 1, search?: string) => {
    setIsLoadingProducts(true)
    try {
      const result = await getProductsWithPagination(page, 20, search)

      if (result.success && Array.isArray(result.data)) {
        setSearchResults(
          result.data.map(
            (product: {
              id: string
              name: string
              sku?: string
              barcode?: string
              stock_quantity?: number
              image_url?: string
            }) => ({
              id: product.id,
              name: product.name,
              code: product.sku || "",
              sku: product.sku || "",
              barcode: product.barcode || "",
              stock: product.stock_quantity || 0,
              image_url: product.image_url,
            }),
          ),
        )

        if (result.pagination) {
          setCurrentPage(result.pagination.page)
          setTotalPages(result.pagination.totalPages)
        }
      } else {
        console.error("Load products failed:", result.error)
        setSearchResults([])
        if (result.error) {
          toast.error(result.error)
        }
      }
    } catch (error) {
      console.error("Load products error:", error)
      setSearchResults([])
      toast.error("Lỗi tải danh sách sản phẩm")
    } finally {
      setIsLoadingProducts(false)
    }
  }, [])

  const searchProductsInDB = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        // Nếu không có từ khóa tìm kiếm, load trang đầu tiên
        await loadProductsWithPagination(1)
        return
      }

      await loadProductsWithPagination(1, searchTerm)
    },
    [loadProductsWithPagination],
  )

  useEffect(() => {
    const debounceTimer = setTimeout(() => searchProductsInDB(searchTerm), 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, searchProductsInDB])

  useEffect(() => {
    if (isMultiSelectDialogOpen && searchResults.length === 0) {
      loadProductsWithPagination(1)
    }
  }, [isMultiSelectDialogOpen, searchResults.length, loadProductsWithPagination])

  const handleCreateSession = async () => {
    if (!checkInfo.code.trim()) {
      toast.error("Vui lòng nhập mã phiếu")
      return
    }

    setIsCreating(true)
    try {
      console.log("🚀 Creating session with data:", {
        branch_name: checkInfo.branch,
        staff_name: checkInfo.staff,
        notes: checkInfo.notes,
        tags: checkInfo.tags,
      })

      const result = await createInventoryCheckSession({
        branch_name: checkInfo.branch,
        staff_name: checkInfo.staff,
        notes: checkInfo.notes,
        tags: checkInfo.tags,
      })

      console.log("📥 Session creation result:", result)

      if (result && result.success && result.sessionId) {
        console.log("✅ Session created successfully:", result.sessionId)
        setCurrentSessionId(result.sessionId.toString())

        if (result.sessionCode) {
          setCheckInfo((prev) => ({ ...prev, code: result.sessionCode }))
        }

        toast.success("Tạo phiếu kiểm hàng thành công")
      } else {
        console.error("❌ Session creation failed:", result.error)
        toast.error(result.error || "Lỗi tạo phiếu kiểm hàng")
      }
    } catch (error) {
      console.error("💥 Error creating session:", error)
      toast.error(`Lỗi tạo phiếu kiểm hàng: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsCreating(false)
    }
  }

  const addProduct = async (product: ProductSearch) => {
    if (!currentSessionId) {
      await handleCreateSession()
      if (!currentSessionId) return
    }

    try {
      await addProductToCheck(currentSessionId, product.id)

      const newProduct: Product = {
        id: product.id,
        name: product.name,
        code: product.code,
        image: product.image_url,
        systemStock: product.stock,
        actualStock: undefined,
        difference: undefined,
        reason: undefined,
        status: "unchecked",
      }

      setProducts([...products, newProduct])
      setSearchTerm("")
      toast.success(`Đã thêm ${product.name}`)
    } catch (error) {
      console.error("Error adding product:", error)
      toast.error("Lỗi thêm sản phẩm")
    }
  }

  const updateProductStock = async (id: string, actualStock: number) => {
    if (!currentSessionId) {
      toast.error("Chưa có phiếu kiểm hàng")
      return
    }

    try {
      console.log("🔄 Updating product stock:", { id, actualStock, sessionId: currentSessionId })

      const result = await updateProductActualStock(currentSessionId, id, actualStock)

      console.log("📥 Update result:", result)

      if (result && result.success) {
        console.log("✅ Stock updated successfully")

        // Chỉ cập nhật UI state khi server action thành công
        setProducts(
          products.map((product) => {
            if (product.id === id) {
              const difference = actualStock - product.systemStock
              const status = difference === 0 ? "matched" : "different"
              return {
                ...product,
                actualStock,
                difference,
                status,
              }
            }
            return product
          }),
        )

        toast.success("Cập nhật số lượng thành công")
      } else {
        console.error("❌ Stock update failed:", result?.error)
        toast.error(result?.error || "Lỗi cập nhật số lượng")
      }
    } catch (error) {
      console.error("💥 Error updating stock:", error)
      toast.error(`Lỗi cập nhật số lượng: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const updateProductReason = (id: string, reason: string) => {
    setProducts(products.map((product) => (product.id === id ? { ...product, reason } : product)))
  }

  const removeProduct = (id: string) => {
    setProducts(products.filter((product) => product.id !== id))
  }

  const handleBalanceInventory = async () => {
    console.log("🔄 Starting balance inventory process...")

    if (!currentSessionId) {
      console.error("❌ No session ID found")
      toast.error("Chưa có phiếu kiểm hàng")
      return
    }

    const sessionIdNumber = Number(currentSessionId)
    if (isNaN(sessionIdNumber)) {
      console.error("❌ Invalid session ID:", currentSessionId)
      toast.error("Session ID không hợp lệ")
      return
    }

    console.log("📋 Session ID:", sessionIdNumber)
    console.log("👤 Staff:", checkInfo.staff)

    const uncheckedProducts = products.filter((p) => p.actualStock === undefined)
    if (uncheckedProducts.length > 0) {
      console.warn("⚠️ Unchecked products:", uncheckedProducts.length)
      toast.error(`Còn ${uncheckedProducts.length} sản phẩm chưa kiểm`)
      return
    }

    console.log("✅ All products checked, proceeding with balance...")
    console.log(
      "📦 Products to balance:",
      products.map((p) => ({
        id: p.id,
        name: p.name,
        systemStock: p.systemStock,
        actualStock: p.actualStock,
        difference: p.difference,
      })),
    )

    setIsBalancing(true)
    try {
      console.log("🚀 Calling balanceInventory function...")
      const result = await balanceInventory(sessionIdNumber, checkInfo.staff)

      console.log("📥 Balance result:", result)

      if (result && result.success) {
        console.log("✅ Balance successful:", result.message)
        toast.success(result.message || "Cân bằng kho thành công")
        router.push("/inventory-check")
      } else {
        console.error("❌ Balance failed:", result?.error)
        toast.error(result?.error || "Lỗi cân bằng kho")
      }
    } catch (error) {
      console.error("💥 Balance error:", error)
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
      toast.error(`Lỗi cân bằng kho: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      console.log("🏁 Balance process completed")
      setIsBalancing(false)
    }
  }

  const getFilteredProducts = () => {
    switch (activeTab) {
      case "unchecked":
        return products.filter((p) => p.status === "unchecked")
      case "matched":
        return products.filter((p) => p.status === "matched")
      case "different":
        return products.filter((p) => p.status === "different")
      default:
        return products
    }
  }

  const getTabCount = (status: string) => {
    if (status === "all") return products.length
    return products.filter((p) => p.status === status).length
  }

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedProducts.size === searchResults.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(searchResults.map((p) => p.id)))
    }
  }

  const addMultipleProducts = async () => {
    if (!currentSessionId) {
      await handleCreateSession()
      if (!currentSessionId) return
    }

    if (selectedProducts.size === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm")
      return
    }

    try {
      const selectedProductsData = searchResults.filter((p) => selectedProducts.has(p.id))

      for (const product of selectedProductsData) {
        await addProductToCheck(currentSessionId, product.id)

        const newProduct: Product = {
          id: product.id,
          name: product.name,
          code: product.code,
          image: product.image_url,
          systemStock: product.stock,
          actualStock: undefined,
          difference: undefined,
          reason: undefined,
          status: "unchecked",
        }

        setProducts((prev) => [...prev, newProduct])
      }

      setIsMultiSelectDialogOpen(false)
      setSelectedProducts(new Set())
      setSearchTerm("")
      toast.success(`Đã thêm ${selectedProducts.size} sản phẩm`)
    } catch (error) {
      console.error("Error adding multiple products:", error)
      toast.error("Lỗi thêm sản phẩm")
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadProductsWithPagination(page, searchTerm || undefined)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory-check">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tạo phiếu kiểm hàng
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory-check">
            <Button variant="outline">Thoát</Button>
          </Link>
          <Button variant="outline" onClick={handleCreateSession} disabled={isCreating || !!currentSessionId}>
            {isCreating ? "Đang tạo..." : currentSessionId ? "Đã tạo phiếu" : "Tạo phiếu kiểm"}
          </Button>
          <Button onClick={handleBalanceInventory} disabled={!currentSessionId || products.length === 0 || isBalancing}>
            {isBalancing ? "Đang cân bằng..." : "Cân bằng kho"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Thông tin phiếu */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phiếu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="branch">Chi nhánh kiểm</Label>
                <Select
                  value={checkInfo.branch}
                  onValueChange={(value) => setCheckInfo({ ...checkInfo, branch: value })}
                  disabled={!!currentSessionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chi nhánh mặc định" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Chi nhánh mặc định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="staff">Nhân viên kiểm</Label>
                <Select
                  value={checkInfo.staff}
                  onValueChange={(value) => setCheckInfo({ ...checkInfo, staff: value })}
                  disabled={!!currentSessionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Dali" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dali">Dali</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="code">Mã phiếu</Label>
                <Input
                  id="code"
                  placeholder="Nhập mã phiếu"
                  value={checkInfo.code}
                  onChange={(e) => setCheckInfo({ ...checkInfo, code: e.target.value })}
                  disabled={!!currentSessionId}
                />
              </div>
            </CardContent>
          </Card>

          {/* Thông tin bổ sung */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin bổ sung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Input
                  id="notes"
                  placeholder="VD: Kiểm hàng ngày 25/07/2022"
                  value={checkInfo.notes}
                  onChange={(e) => setCheckInfo({ ...checkInfo, notes: e.target.value })}
                  disabled={!!currentSessionId}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Nhập ký tự và ấn enter"
                  value={checkInfo.tags}
                  onChange={(e) => setCheckInfo({ ...checkInfo, tags: e.target.value })}
                  disabled={!!currentSessionId}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Products */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList>
                    <TabsTrigger value="all">Tất cả ({getTabCount("all")})</TabsTrigger>
                    <TabsTrigger value="unchecked">Chưa kiểm ({getTabCount("unchecked")})</TabsTrigger>
                    <TabsTrigger value="matched">Khớp ({getTabCount("matched")})</TabsTrigger>
                    <TabsTrigger value="different">Lệch ({getTabCount("different")})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, mã SKU, hoặc quét mã Barcode...(F3)"
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-3 hover:bg-muted cursor-pointer"
                          onClick={() => addProduct(product)}
                        >
                          <Image
                            src={product.image_url || "/placeholder.svg?height=40&width=40"}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {product.code && <p>SKU: {product.code}</p>}
                              {product.barcode && <p>Barcode: {product.barcode}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              Tồn: <span className="text-blue-600">{product.stock}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Select defaultValue="barcode">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barcode">Barcode</SelectItem>
                    <SelectItem value="manual">Thủ công</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isMultiSelectDialogOpen} onOpenChange={setIsMultiSelectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm nhiều sản phẩm
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col space-y-4 min-h-0">
                    {/* Header */}
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>Chọn sản phẩm</DialogTitle>
                    </DialogHeader>

                    {/* Body */}
                    <div className="flex-1 flex flex-col space-y-4 min-h-0">
                      {/* Search */}
                      <div className="relative flex-shrink-0">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Tìm theo tên, mã SKU, hoặc quét mã Barcode..."
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      {/* Select All */}
                      {searchResults.length > 0 && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            type="checkbox"
                            id="select-all"
                            checked={selectedProducts.size === searchResults.length && searchResults.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded"
                          />
                          <label htmlFor="select-all" className="text-sm font-medium">
                            Đã chọn {selectedProducts.size} sản phẩm
                          </label>
                        </div>
                      )}

                      {/* Product List */}
                      <div className="flex-1 overflow-y-auto border rounded-lg">
                        {isLoadingProducts ? (
                          <div className="text-center py-8">Đang tải sản phẩm...</div>
                        ) : searchResults.length > 0 ? (
                          <div className="divide-y">
                            {searchResults.map((product) => (
                              <div key={product.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                                <input
                                  type="checkbox"
                                  checked={selectedProducts.has(product.id)}
                                  onChange={() => toggleProductSelection(product.id)}
                                  className="rounded"
                                />
                                <Image
                                  src={product.image_url || "/placeholder.svg?height=50&width=50"}
                                  alt={product.name}
                                  width={50}
                                  height={50}
                                  className="rounded object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{product.name}</p>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    {product.code && <p>{product.code} Mặc định</p>}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm">
                                    Giá nhập: <span className="font-medium">270,000</span>
                                  </p>
                                  <p className="text-sm">
                                    Tồn: <span className="text-blue-600 font-medium">{product.stock}</span> | Có thể
                                    bán: <span className="text-blue-600 font-medium">{product.stock}</span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">Không tìm thấy sản phẩm</div>
                        )}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                          >
                            ←
                          </Button>
                          <span className="text-sm">
                            Trang {currentPage} / {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                          >
                            →
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
                      <p className="text-sm text-muted-foreground">Đã chọn: {selectedProducts.size} sản phẩm</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsMultiSelectDialogOpen(false)
                            setSelectedProducts(new Set())
                            setSearchTerm("")
                            setCurrentPage(1)
                          }}
                        >
                          Thoát
                        </Button>
                        <Button onClick={addMultipleProducts} disabled={selectedProducts.size === 0}>
                          Xác nhận
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {getFilteredProducts().length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 opacity-20">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1v6m6-6v6" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground">Phiếu kiểm hàng của bạn chưa có sản phẩm nào</p>
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => setIsMultiSelectDialogOpen(true)}
                  >
                    Thêm sản phẩm
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Ảnh</TableHead>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead>Tồn chi nhánh</TableHead>
                      <TableHead>Tồn thực tế</TableHead>
                      <TableHead>Lệch</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredProducts().map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Image
                            src={product.image || "/placeholder.svg?height=40&width=40"}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>---</TableCell>
                        <TableCell>{product.systemStock}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={product.actualStock || ""}
                            onChange={(e) => updateProductStock(product.id, Number.parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          {product.difference !== undefined && (
                            <span className={product.difference === 0 ? "text-green-600" : "text-red-600"}>
                              {product.difference > 0 ? "+" : ""}
                              {product.difference}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={product.reason}
                            onValueChange={(value) => updateProductReason(product.id, value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Khác" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="damaged">Hỏng</SelectItem>
                              <SelectItem value="lost">Mất</SelectItem>
                              <SelectItem value="expired">Hết hạn</SelectItem>
                              <SelectItem value="other">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input placeholder="Nhập ghi chú" className="w-32" />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeProduct(product.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {getFilteredProducts().length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Hiển thị {getFilteredProducts().length} sản phẩm</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
