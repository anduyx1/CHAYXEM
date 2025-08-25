"use client"

import type React from "react"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { InvoiceSettings, PrintTemplate } from "@/lib/types/database"
import { getInvoiceSettings, updateInvoiceSettings } from "@/lib/actions/settings"
import { getAllPrintTemplates } from "@/lib/actions/print-templates" // Changed import
import InvoicePreview from "@/app/components/invoice-preview"
import { UploadCloud, Loader2 } from "lucide-react"
import Image from "next/image"
import { uploadImage } from "@/actions/upload-image"

const defaultInvoiceSettings: InvoiceSettings = {
  businessName: "Cửa hàng của bạn",
  businessAddress: "Địa chỉ cửa hàng của bạn",
  businessPhone: "0123456789", // Added
  businessTaxId: "0123456789", // Added
  showCustomerInfo: true,
  showTax: true,
  showDiscount: true,
  showNotes: true, // Added
  headerFontSize: "text-2xl",
  textColor: "text-gray-800",
  logoUrl: null,
  businessEmail: null, // Added
  businessWebsite: null, // Added
  defaultTemplate: null, // Added
}

export default function InvoiceSettingsPage() {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultInvoiceSettings)
  const [printTemplates, setPrintTemplates] = useState<PrintTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplateContent, setSelectedTemplateContent] = useState<string>("")
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // Changed function call
      const [currentSettings, fetchedTemplates] = await Promise.all([getInvoiceSettings(), getAllPrintTemplates()])

      if (currentSettings) {
        setSettings(currentSettings)
      }
      setPrintTemplates(fetchedTemplates)

      // Set default selected template if available
      if (fetchedTemplates.length > 0) {
        const defaultReceiptTemplate = fetchedTemplates.find(
          (template) => template.type === "receipt" && template.is_default,
        )
        if (defaultReceiptTemplate) {
          setSelectedTemplateId(defaultReceiptTemplate.id)
          setSelectedTemplateContent(defaultReceiptTemplate.content)
        } else {
          // Fallback to first template if no default receipt template
          setSelectedTemplateId(fetchedTemplates[0].id)
          setSelectedTemplateContent(fetchedTemplates[0].content)
        }
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    // Update selected template content when selectedTemplateId changes
    const template = printTemplates.find((t) => t.id === selectedTemplateId)
    if (template) {
      setSelectedTemplateContent(template.content)
    } else {
      setSelectedTemplateContent("") // Clear if no template selected
    }
  }, [selectedTemplateId, printTemplates])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setSettings((prev) => ({ ...prev, [id]: value }))
  }

  const handleSwitchChange = (id: keyof InvoiceSettings, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [id]: checked }))
  }

  const handleSelectChange = (id: keyof InvoiceSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [id]: value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadImage(formData)
      if (result.success && result.url) {
        setSettings((prev) => ({ ...prev, logoUrl: result.url }))
        toast({
          title: "Tải lên logo thành công",
          description: "Logo đã được cập nhật.",
        })
      } else {
        toast({
          title: "Lỗi tải lên logo",
          description: result.error || "Không thể tải lên logo.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const { success, error } = await updateInvoiceSettings(settings)
      if (success) {
        toast({
          title: "Cập nhật thành công",
          description: "Cài đặt hóa đơn đã được lưu.",
        })
      } else {
        toast({
          title: "Lỗi",
          description: error || "Không thể lưu cài đặt hóa đơn.",
          variant: "destructive",
        })
      }
    })
  }

  // Dummy data for preview
  const dummyInvoiceItems = [
    { description: "Sản phẩm A", quantity: 2, unitPrice: 100000, total: 200000 },
    { description: "Sản phẩm B", quantity: 1, unitPrice: 150000, total: 150000 },
  ]
  const dummySubtotal = dummyInvoiceItems.reduce((sum, item) => sum + item.total, 0)
  const dummyTaxAmount = settings.showTax ? dummySubtotal * 0.1 : 0 // Example 10% tax
  const dummyDiscountAmount = settings.showDiscount ? dummySubtotal * 0.05 : 0 // Example 5% discount
  const dummyTotalAmount = dummySubtotal + dummyTaxAmount - dummyDiscountAmount

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2 text-gray-600">Đang tải cài đặt hóa đơn...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
      <div className="lg:w-1/2 space-y-6">
        <h1 className="text-3xl font-bold">Cài đặt hóa đơn</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin doanh nghiệp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Tên doanh nghiệp</Label>
                <Input id="businessName" value={settings.businessName} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="businessAddress">Địa chỉ doanh nghiệp</Label>
                <Input id="businessAddress" value={settings.businessAddress} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="businessPhone">Số điện thoại</Label>
                <Input id="businessPhone" value={settings.businessPhone || ""} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="businessEmail">Email</Label>
                <Input id="businessEmail" value={settings.businessEmail || ""} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="businessWebsite">Website</Label>
                <Input id="businessWebsite" value={settings.businessWebsite || ""} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="businessTaxId">Mã số thuế</Label>
                <Input id="businessTaxId" value={settings.businessTaxId || ""} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="logoUrl">Logo (URL)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="logoUrl"
                    value={settings.logoUrl || ""}
                    onChange={handleInputChange}
                    placeholder="Hoặc tải lên từ máy tính"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer p-2 border rounded-md hover:bg-gray-50">
                    <UploadCloud className="h-5 w-5" />
                    <span className="sr-only">Tải lên logo</span>
                  </label>
                  <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
                {settings.logoUrl && (
                  <div className="relative mt-2 h-16 w-32">
                    <Image
                      src={settings.logoUrl || "/placeholder.svg"}
                      alt="Logo Preview"
                      fill
                      className="object-contain"
                      sizes="128px"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tùy chọn hiển thị</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showCustomerInfo">Hiển thị thông tin khách hàng</Label>
                <Switch
                  id="showCustomerInfo"
                  checked={settings.showCustomerInfo}
                  onCheckedChange={(checked) => handleSwitchChange("showCustomerInfo", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showTax">Hiển thị thuế</Label>
                <Switch
                  id="showTax"
                  checked={settings.showTax}
                  onCheckedChange={(checked) => handleSwitchChange("showTax", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showDiscount">Hiển thị giảm giá</Label>
                <Switch
                  id="showDiscount"
                  checked={settings.showDiscount}
                  onCheckedChange={(checked) => handleSwitchChange("showDiscount", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showNotes">Hiển thị ghi chú</Label>
                <Switch
                  id="showNotes"
                  checked={settings.showNotes}
                  onCheckedChange={(checked) => handleSwitchChange("showNotes", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kiểu chữ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="headerFontSize">Kích thước tiêu đề</Label>
                <Select
                  value={settings.headerFontSize}
                  onValueChange={(value) => handleSelectChange("headerFontSize", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn kích thước" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-xl">Nhỏ (text-xl)</SelectItem>
                    <SelectItem value="text-2xl">Trung bình (text-2xl)</SelectItem>
                    <SelectItem value="text-3xl">Lớn (text-3xl)</SelectItem>
                    <SelectItem value="text-4xl">Rất lớn (text-4xl)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="textColor">Màu chữ</Label>
                <Select value={settings.textColor} onValueChange={(value) => handleSelectChange("textColor", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn màu chữ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-gray-900">Đen (text-gray-900)</SelectItem>
                    <SelectItem value="text-gray-800">Xám đậm (text-gray-800)</SelectItem>
                    <SelectItem value="text-gray-700">Xám (text-gray-700)</SelectItem>
                    <SelectItem value="text-blue-600">Xanh dương (text-blue-600)</SelectItem>
                    <SelectItem value="text-red-600">Đỏ (text-red-600)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </form>
      </div>

      <div className="lg:w-1/2 lg:sticky lg:top-4 h-fit">
        <h2 className="text-2xl font-bold mb-4">Xem trước hóa đơn</h2>
        <div className="mb-4">
          <Label htmlFor="template-select">Chọn mẫu in để xem trước</Label>
          <Select
            value={selectedTemplateId ?? undefined}
            onValueChange={(value) => setSelectedTemplateId(value)}
            disabled={printTemplates.length === 0}
          >
            <SelectTrigger id="template-select" className="w-full">
              <SelectValue placeholder="Chọn một mẫu in" />
            </SelectTrigger>
            <SelectContent>
              {printTemplates
                .filter((template) => template.id !== "")
                .map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.type === "receipt" ? "Hóa đơn" : "Tạm tính"})
                    {template.is_default && " (Mặc định)"}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {printTemplates.length === 0 && (
            <p className="text-sm text-red-500 mt-2">
              Chưa có mẫu in nào. Vui lòng tạo mẫu in tại{" "}
              <a href="/settings/print-templates" className="underline">
                Cài đặt &gt; Mẫu in
              </a>{" "}
              để xem trước.
            </p>
          )}
        </div>
        {selectedTemplateContent ? (
          <InvoicePreview
            invoiceDate="21/06/2025"
            invoiceNumber="INV-2025-001"
            customerName={settings.showCustomerInfo ? "Nguyễn Văn A" : undefined}
            customerAddress={settings.showCustomerInfo ? "456 Đường QWE, Quận 3, TP.HCM" : undefined}
            items={dummyInvoiceItems}
            subtotal={dummySubtotal}
            taxAmount={dummyTaxAmount}
            discountAmount={dummyDiscountAmount}
            totalAmount={dummyTotalAmount}
            settings={settings}
            templateContent={selectedTemplateContent}
          />
        ) : (
          <Card className="border border-gray-300 p-4 text-center text-gray-500">
            Vui lòng chọn một mẫu in để xem trước.
          </Card>
        )}
      </div>
    </div>
  )
}
