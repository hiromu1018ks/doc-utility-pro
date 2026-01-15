"use client"

import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function OutputOptions() {
  const [options, setOptions] = useState({
    keepFilename: true,
    createBookmarks: true,
    imageQuality: "high",
    optimize: false,
  })

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-[#374151]">出力オプション</h2>
      </div>

      <Separator />

      <div className="flex-1 space-y-6 p-4">
        {/* 結合順序 */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-[#6b7280] uppercase">
            結合順序
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="order"
                defaultChecked
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-[#374151]">元の順序</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="order"
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-[#374151]">ファイル名順</span>
            </label>
          </div>
        </div>

        <Separator />

        {/* ファイル名オプション */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="keep-filename" className="text-sm text-[#374151]">
              ファイル名を維持する
            </Label>
            <p className="text-xs text-[#9ca3af]">
              元のファイル名を保持します
            </p>
          </div>
          <Switch
            id="keep-filename"
            checked={options.keepFilename}
            onClick={() =>
              setOptions({ ...options, keepFilename: !options.keepFilename })
            }
          />
        </div>

        {/* しおりオプション */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="bookmarks" className="text-sm text-[#374151]">
              しおり (目次) を作成
            </Label>
            <p className="text-xs text-[#9ca3af]">
              ファイル名を目次として追加します
            </p>
          </div>
          <Checkbox
            id="bookmarks"
            checked={options.createBookmarks}
            onClick={() =>
              setOptions({
                ...options,
                createBookmarks: !options.createBookmarks,
              })
            }
          />
        </div>

        <Separator />

        {/* 画像品質 */}
        <div className="space-y-2">
          <Label htmlFor="quality" className="text-sm text-[#374151]">
            画像品質
          </Label>
          <Select
            id="quality"
            value={options.imageQuality}
            onChange={(e) =>
              setOptions({ ...options, imageQuality: e.target.value })
            }
          >
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </Select>
        </div>

        <Separator />

        {/* ファイルサイズ最適化 */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="optimize" className="text-sm text-[#374151]">
              ファイルサイズを最適化
            </Label>
            <p className="text-xs text-[#9ca3af]">
              出力ファイルを圧縮します
            </p>
          </div>
          <Switch
            id="optimize"
            checked={options.optimize}
            onClick={() =>
              setOptions({ ...options, optimize: !options.optimize })
            }
          />
        </div>
      </div>

      <Separator />

      {/* Action Button */}
      <div className="p-4">
        <Button className="w-full" size="lg">
          処理を実行してダウンロード
        </Button>
      </div>
    </div>
  )
}
