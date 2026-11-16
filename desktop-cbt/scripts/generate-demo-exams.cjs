const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DEMO_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEII/7QOXZgLNQPJb1u04yHrxZESFsbhhnU5EeDPbKje8W
-----END PRIVATE KEY-----`;
const privateKey = crypto.createPrivateKey(DEMO_PRIVATE_KEY);

const banks = {
  Mathematics: [
    ["What is 7 + 5?", ["10", "11", "12", "13"], 2],
    ["What is half of 18?", ["7", "8", "9", "10"], 2],
    ["Which number is even?", ["5", "9", "12", "15"], 2],
    ["How many sides has a triangle?", ["2", "3", "4", "5"], 1],
    ["What is 4 × 3?", ["7", "10", "12", "14"], 2],
    ["What is 20 − 8?", ["10", "11", "12", "13"], 2],
    ["Which is the largest number?", ["16", "61", "26", "41"], 1],
    ["How many minutes are in one hour?", ["30", "45", "60", "90"], 2],
  ],
  English: [
    ["Choose the correctly spelt word.", ["Becaus", "Because", "Becose", "Beacause"], 1],
    ["Which word is a noun?", ["Quickly", "Run", "Teacher", "Beautiful"], 2],
    ["Choose the opposite of 'early'.", ["Soon", "Late", "Fast", "First"], 1],
    ["Which punctuation ends a question?", ["Full stop", "Comma", "Question mark", "Colon"], 2],
    ["Choose the plural of 'child'.", ["Childs", "Childes", "Children", "Childrens"], 2],
    ["Which word is a verb?", ["Sing", "Blue", "Soft", "Table"], 0],
    ["Complete: She ___ to school every day.", ["go", "goes", "going", "gone"], 1],
    ["Which is a proper noun?", ["city", "school", "Lagos", "river"], 2],
  ],
  "Basic Science": [
    ["Which organ pumps blood around the body?", ["Lungs", "Heart", "Brain", "Kidney"], 1],
    ["Which of these is a source of light?", ["Stone", "Sun", "Chair", "Book"], 1],
    ["Plants make food mainly in their…", ["Roots", "Flowers", "Leaves", "Fruits"], 2],
    ["Which animal is a mammal?", ["Lizard", "Frog", "Goat", "Fish"], 2],
    ["Water freezes into…", ["Steam", "Ice", "Smoke", "Sand"], 1],
    ["Which sense organ helps us hear?", ["Eye", "Ear", "Nose", "Tongue"], 1],
    ["The Earth moves around the…", ["Moon", "Mars", "Sun", "Clouds"], 2],
    ["Which material is attracted by a magnet?", ["Wood", "Plastic", "Iron", "Paper"], 2],
  ],
};

const classes = [
  { id: "primary-1", name: "Primary 1", code: "P1" },
  { id: "primary-2", name: "Primary 2", code: "P2" },
  { id: "primary-3", name: "Primary 3", code: "P3" },
];
const arms = [
  { id: "ruby", name: "Ruby", code: "R" },
  { id: "sapphire", name: "Sapphire", code: "S" },
];
const names = ["Ada Okafor", "Daniel Bello", "Mary James", "Samuel Musa"];
const now = Date.now();
const opensAt = new Date(now - 30 * 86400000).toISOString();
const closesAt = new Date(now + 365 * 86400000).toISOString();
const output = path.join(__dirname, "..", "demo-exams");
fs.mkdirSync(output, { recursive: true });

for (const cls of classes) {
  for (const arm of arms) {
    for (const [subject, bank] of Object.entries(banks)) {
      const subjectSlug = subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const examId = "demo-" + cls.code.toLowerCase() + "-" + arm.code.toLowerCase() + "-" + subjectSlug;
      const questions = bank.map((row, index) => ({
        id: examId + "-q" + (index + 1),
        prompt: row[0],
        options: row[1].map((text, optionIndex) => ({ id: String.fromCharCode(65 + optionIndex), text })),
        points: 1,
      }));
      const candidates = names.map((displayName, index) => ({
        studentId: "demo-student-" + cls.code + "-" + arm.code + "-" + (index + 1),
        admissionNumber: "DEMO-" + cls.code + "-" + arm.code + "-" + String(index + 1).padStart(3, "0"),
        displayName,
        classId: cls.id,
        className: cls.name,
        armId: arm.id,
        armName: arm.name,
      }));
      const answerKey = bank.map((row, index) => ({
        questionId: questions[index].id,
        correctOptionId: String.fromCharCode(65 + row[2]),
        points: 1,
      }));
      const payload = {
        schemaVersion: 1,
        id: examId + "-v1",
        schoolId: "imagemakers-demo",
        sessionId: "demo-session",
        examId,
        version: 1,
        title: "Demo " + subject + " Assessment",
        subject,
        classId: cls.id,
        className: cls.name,
        armId: arm.id,
        armName: arm.name,
        opensAt,
        closesAt,
        durationSeconds: 600,
        instructions: "DEMO ONLY — answer all questions. You may move backwards and change an answer before submitting.",
        questions,
        candidates,
        answerKey,
        demoPackage: true,
      };
      const canonical = JSON.stringify(payload);
      const envelope = {
        payload,
        signature: crypto.sign(null, Buffer.from(canonical, "utf8"), privateKey).toString("base64"),
        packageHash: crypto.createHash("sha256").update(canonical, "utf8").digest("hex"),
      };
      const filename = cls.code + "-" + arm.code + "-" + subjectSlug + ".imexam";
      fs.writeFileSync(path.join(output, filename), JSON.stringify(envelope, null, 2) + "\n", "utf8");
    }
  }
}
console.log("Generated 18 signed demo exam packages in " + output);
