import { LogOut, Mail, User2, GraduationCap } from "lucide-react";
import { BaseProfilePayload, TeacherProfilePayload, ParentProfilePayload } from "@/types/auth.types";

type Role = "parent" | "teacher" | "student" | "admin";
type ProfileMap = {
  parent: ParentProfilePayload;
  teacher: TeacherProfilePayload;
  student: BaseProfilePayload;
  admin: BaseProfilePayload;
};

type Props<R extends Role> = {
  role: R;
  profile: ProfileMap[R] | null | undefined;
  handleLogout: () => void;
  className?: string;
};

export function ProfileCard<R extends Role>({ role, profile, handleLogout, className }: Props<R>) {
  return (
    <div className={`rounded-2xl bg-[#FFF8EC] border border-[#DE954F] text-[#513723] shadow-lg p-5 w-72 ${className || ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-base font-semibold">Profile</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User2 className="w-4 h-4" />
          <p className="text-sm">{profile?.fullName ?? "-"}</p>
        </div>

        {role === "parent" && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <p className="text-sm">{(profile as ParentProfilePayload)?.email ?? "-"}</p>
          </div>
        )}

        {role === "teacher" && (
          <>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <p className="text-sm">{(profile as TeacherProfilePayload)?.email ?? "-"}</p>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <p className="text-sm">{(profile as TeacherProfilePayload)?.schoolName ?? "-"}</p>
            </div>
          </>
        )}

        <div className="my-2 h-px bg-[#DE954F] " />

        <button
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#DE954F]  px-4 py-2 text-sm font-medium hover:bg-[#EDD1B0] active:scale-[0.99] transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
