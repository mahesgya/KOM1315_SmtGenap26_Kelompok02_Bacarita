'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { IBonusStudent } from '@/types/bonus.types';

interface BonusStoryFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    passage: string;
    imageCover: File | null;
    studentIds: number[];
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  students: IBonusStudent[];
  initialData?: {
    title: string;
    description: string;
    passage: string;
    studentIds: number[];
  };
  mode?: 'create' | 'edit';
}

export default function BonusStoryForm({
  onSubmit,
  onCancel,
  isLoading = false,
  students,
  initialData,
  mode = 'create',
}: BonusStoryFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    passage: initialData?.passage || '',
    imageCover: null as File | null,
  });

  const [selectedStudents, setSelectedStudents] = useState<number[]>(initialData?.studentIds || []);
  const [searchStudent, setSearchStudent] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, imageCover: file }));
  };

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) || s.nisn.includes(searchStudent)
  );

  const getSelectedStudentNames = () => {
    return students.filter((s) => selectedStudents.includes(s.id)).map((s) => s.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Judul tidak boleh kosong');
      return;
    }
    if (!formData.passage.trim()) {
      alert('Passage tidak boleh kosong');
      return;
    }
    if (!initialData && !formData.imageCover) {
      alert('Pilih gambar terlebih dahulu');
      return;
    }
    if (selectedStudents.length === 0) {
      alert('Pilih minimal satu siswa');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        studentIds: selectedStudents,
      });
    } catch (error) {
      console.error('Form submit error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#DE954F] bg-[#FFF8EC] p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#4A2C19]">
            {mode === 'create' ? 'Tambah Bacaan Bonus' : 'Edit Bacaan Bonus'}
          </h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-[#8A5B3D] hover:text-[#4A2C19] disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#4A2C19]">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Masukkan judul bacaan..."
              className="mt-1 w-full rounded-lg border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-sm text-[#4A2C19] placeholder-[#8A5B3D] focus:outline-none focus:ring-2 focus:ring-[#DE954F]"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#4A2C19]">Deskripsi</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Masukkan deskripsi bacaan..."
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-sm text-[#4A2C19] placeholder-[#8A5B3D] focus:outline-none focus:ring-2 focus:ring-[#DE954F]"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#4A2C19]">
              Passage <span className="text-red-500">*</span>
            </label>
            <textarea
              name="passage"
              value={formData.passage}
              onChange={handleInputChange}
              placeholder="Masukkan teks bacaan lengkap..."
              rows={4}
              className="mt-1 w-full rounded-lg border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-sm text-[#4A2C19] placeholder-[#8A5B3D] focus:outline-none focus:ring-2 focus:ring-[#DE954F]"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#4A2C19]">
              Gambar Cover {!initialData && <span className="text-red-500">*</span>}
            </label>
            <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 hover:bg-[#FFF8EC]">
              <span className="text-sm text-[#4A2C19]">
                {formData.imageCover ? formData.imageCover.name : 'Pilih Gambar'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#4A2C19]">
                Pilih Siswa Penerima Bonus <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudents(students.map((s) => s.id))}
                  className="text-xs text-[#DE954F] hover:text-[#c57833] font-medium"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudents([])}
                  className="text-xs text-[#DE954F] hover:text-[#c57833] font-medium"
                >
                  Hapus Semua
                </button>
              </div>
            </div>

            <div className="mt-1 relative z-20">
              <input
                type="text"
                placeholder="Cari siswa..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                onFocus={() => setShowStudentList(true)}
                className="w-full rounded-lg border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-sm text-[#4A2C19] placeholder-[#8A5B3D] focus:outline-none focus:ring-2 focus:ring-[#DE954F]"
                disabled={isLoading}
              />

              {showStudentList && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#DE954F] bg-[#FFF8EC] shadow-md">
                  {filteredStudents.length === 0 ? (
                    <div className="px-3 py-2 text-center text-xs text-[#8A5B3D]">Siswa tidak ditemukan</div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-[#FFF8EC] transition-colors cursor-pointer"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleStudentToggle(student.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          readOnly
                          className="rounded"
                        />
                        <span className="text-sm text-[#4A2C19]">{student.name}</span>
                        <span className="ml-auto text-xs text-[#8A5B3D]">{student.kelas}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {showStudentList && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowStudentList(false)}
                />
              )}
            </div>

            <div className="mt-2 min-h-8 rounded-lg border border-[#DE954F] bg-[#FFF8EC] p-2">
              {selectedStudents.length === 0 ? (
                <p className="text-xs text-[#8A5B3D]">Belum ada siswa terpilih</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {getSelectedStudentNames().map((name, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-[#DE954F] px-2 py-1 text-xs font-medium text-white"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => {
                          const studentId = students.find((s) => s.name === name)?.id;
                          if (studentId) handleStudentToggle(studentId);
                        }}
                        className="hover:text-[#FFF8EC]"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-[#8A5B3D]">Terpilih: {selectedStudents.length} siswa</p>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-[#DE954F] px-4 py-2 text-xs font-semibold text-[#DE954F] hover:bg-[#FFF8EC] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-[#DE954F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c57833] disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : mode === 'create' ? 'Simpan' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
