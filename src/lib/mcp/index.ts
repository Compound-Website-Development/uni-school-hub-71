import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfileTool from "./tools/get-my-profile";
import listStudentsTool from "./tools/list-students";
import getStudentRecordTool from "./tools/get-student-record";
import listClassesTool from "./tools/list-classes";
import listAnnouncementsTool from "./tools/list-announcements";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "image-makers-school-mangementsystem",
  title: "Image Makers School mangementsystem",
  version: "0.1.0",
  instructions:
    "Tools for the Imagemakers Nursery and Primary School management portal. Use `get_my_profile` to see who you are acting as, `list_classes` and `list_students` to browse the roll, `get_student_record` for one pupil's grades and attendance, and `list_announcements` for school notices. All data is scoped by the signed-in user's permissions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyProfileTool,
    listClassesTool,
    listStudentsTool,
    getStudentRecordTool,
    listAnnouncementsTool,
  ],
});
