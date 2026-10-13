import { jsPDF } from "jspdf";

export function exportEssayPDF(essay) {
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(13, 148, 136); // Teal
  doc.text("StudyMate AI - Essay Evaluation Report", 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(`Title: ${essay.title || "Academic Essay"}`, 14, 32);
  doc.text(`Overall Score: ${essay.overall || 75}%`, 14, 40);

  doc.setFontSize(11);
  doc.text(`Grammar: ${essay.grammar || 80}%  |  Vocabulary: ${essay.vocabulary || 80}%`, 14, 50);
  doc.text(`Coherence: ${essay.coherence || 80}% | Structure: ${essay.structure || 80}%`, 14, 58);

  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 64, 196, 64);

  let y = 74;
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Strengths & Recommendations:", 14, y);
  y += 8;
  doc.setFontSize(10);

  const items = [
    ...(essay.strengths || []).map((s) => `• Strength: ${s}`),
    ...(essay.improvements || []).map((i) => `• Area to Improve: ${i}`),
    ...(essay.suggestions || []).map((s) => `• Suggestion: ${s}`)
  ];

  items.forEach((item) => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, y);
    y += lines.length * 6;
  });

  doc.save(`StudyMate_Essay_Report.pdf`);
}
