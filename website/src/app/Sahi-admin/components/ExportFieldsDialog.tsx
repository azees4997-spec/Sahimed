"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download } from 'lucide-react';

interface ExportFieldsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fields: string[];
  onExport: (selectedFields: string[]) => void;
  title: string;
}

export function ExportFieldsDialog({
  isOpen,
  onClose,
  fields,
  onExport,
  title
}: ExportFieldsDialogProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(fields);

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const toggleAll = () => {
    if (selectedFields.length === fields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(fields);
    }
  };

  const handleExport = () => {
    onExport(selectedFields);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[40px] max-w-md border-none p-0 overflow-hidden bg-white">
        <DialogHeader className="bg-primary p-8 text-white space-y-2">
          <DialogTitle className="text-2xl font-black text-white">Configure Export Columns</DialogTitle>
          <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
            Select the fields to include in the {title} CSV export
          </DialogDescription>
        </DialogHeader>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <span className="text-[11px] font-black text-slate-500 uppercase">Columns selected ({selectedFields.length}/{fields.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="text-[10px] font-black text-primary uppercase hover:bg-slate-50 rounded-full h-8 px-4"
            >
              {selectedFields.length === fields.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-h-[220px] overflow-y-auto pr-2">
            {fields.map((field) => (
              <div key={field} className="flex items-center space-x-3 p-3 bg-slate-50 hover:bg-slate-100/70 rounded-2xl transition-all cursor-pointer" onClick={() => toggleField(field)}>
                <Checkbox
                  id={`field-${field}`}
                  checked={selectedFields.includes(field)}
                  onCheckedChange={() => toggleField(field)}
                  className="rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor={`field-${field}`}
                  className="text-xs font-bold text-slate-700 cursor-pointer truncate uppercase"
                >
                  {field.replace(/_/g, ' ')}
                </Label>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-14 rounded-full font-black text-slate-500 hover:bg-slate-50 uppercase text-[11px] tracking-wider"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedFields.length === 0}
              className="flex-1 h-14 rounded-full font-black bg-primary text-white hover:scale-[1.02] active:scale-95 transition-all uppercase text-[11px] tracking-wider gap-2 shadow-lg shadow-primary/25"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
