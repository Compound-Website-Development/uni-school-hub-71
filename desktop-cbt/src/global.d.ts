export {};
declare global {
  interface ExamPackage {
    id:string; exam_id:string; title:string; subject:string; class_id:string; class_name?:string;
    arm_id?:string; arm_name?:string; opens_at:string; closes_at:string; duration_seconds:number;
    version:number; imported_at:string; is_demo:number;
  }
  interface ExamQuestion { id:string; prompt:string; options:{id:string;text:string}[]; points:number; }
  interface ExamSession {
    attempt:{id:string;startedAt:string;deadlineAt:string;status:string};
    exam:{id:string;title:string;subject:string;className:string;armName:string;durationSeconds:number;instructions:string};
    questions:ExamQuestion[];
    answers:Record<string,string>;
  }
  interface ExamResult {
    attemptId:string;examTitle:string;subject:string;candidateName:string;admissionNumber:string;
    className:string;armName:string;score:number|null;totalPoints:number|null;status:string;
    syncStatus:string;submittedAt:string;demo:boolean;
  }
  interface CbtBridge {
    getStatus:()=>Promise<any>; getDiagnostics:()=>Promise<any>; recover:()=>Promise<any>;
    listPackages:()=>Promise<ExamPackage[]>; importPackage:()=>Promise<any>; getQueue:()=>Promise<any>; getActiveExam:()=>Promise<any>; setActiveExam:(examId:string)=>Promise<any>; getStaffAuthStatus:()=>Promise<any>; signInStaff:(email:string,password:string)=>Promise<any>; signOutStaff:()=>Promise<any>; syncAttempts:()=>Promise<any>;
    getExamPreview:(examId:string)=>Promise<any>; lookupCandidate:(examId:string,admissionNumber:string)=>Promise<any>;
    startAttempt:(examId:string,admissionNumber:string,candidateName:string)=>Promise<ExamSession>;
    resumeAttempt:(attemptId:string,admissionNumber:string)=>Promise<ExamSession>;
    saveAnswer:(attemptId:string,admissionNumber:string,questionId:string,optionId:string)=>Promise<any>;
    submitAttempt:(attemptId:string,admissionNumber:string)=>Promise<ExamResult>;
    getResult:(attemptId:string,admissionNumber:string)=>Promise<ExamResult>;
    supervisorPinStatus:()=>Promise<any>;setSupervisorPin:(pin:string)=>Promise<any>;
    unlockSupervisor:(pin:string)=>Promise<any>;getResults:()=>Promise<any[]>;lockSupervisor:()=>Promise<any>;
  }
  interface Window { cbt:CbtBridge; }
}
