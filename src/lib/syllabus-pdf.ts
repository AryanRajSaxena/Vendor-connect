import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface CoursePdfData {
  name: string;
  category?: string;
  description?: string;
  courseDuration?: string;
  basePrice?: number;
  highlights?: string[];
  prerequisites?: string[];
  learningOutcomes?: string[];
  curriculum?: Array<{
    module?: number;
    title?: string;
    lessons?: number;
    duration?: string;
  }>;
}

function wrapText(text: string, maxCharsPerLine: number = 75): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length < maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generateSyllabusPdfBytes(course: CoursePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);

  let y = height - 50;

  const checkPageBreak = (neededSpace: number = 30) => {
    if (y < neededSpace + 50) {
      page = doc.addPage([595.28, 841.89]);
      y = height - 50;
    }
  };

  // Header Banner Background
  page.drawRectangle({
    x: 40,
    y: y - 55,
    width: width - 80,
    height: 65,
    color: rgb(0.06, 0.09, 0.16),
  });

  // Header Title
  const courseTitle = course.name || 'Course Syllabus';
  page.drawText(courseTitle.slice(0, 48), {
    x: 55,
    y: y - 25,
    size: 18,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  const subtitle = `${course.category || 'Online Course'} • ${course.courseDuration || 'Self-paced'}`;
  page.drawText(subtitle, {
    x: 55,
    y: y - 45,
    size: 11,
    font: regularFont,
    color: rgb(0.2, 0.78, 0.55),
  });

  y -= 80;

  // Course Description Section
  if (course.description) {
    checkPageBreak(50);
    page.drawText('Course Overview', {
      x: 40,
      y,
      size: 13,
      font: boldFont,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 18;

    const descLines = wrapText(course.description, 80);
    for (const line of descLines) {
      checkPageBreak(15);
      page.drawText(line, {
        x: 40,
        y,
        size: 10,
        font: regularFont,
        color: rgb(0.25, 0.3, 0.38),
      });
      y -= 14;
    }
    y -= 10;
  }

  // Key Highlights
  if (course.highlights && course.highlights.length > 0) {
    checkPageBreak(40);
    page.drawText('Key Highlights & Skills', {
      x: 40,
      y,
      size: 13,
      font: boldFont,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 18;

    for (const h of course.highlights) {
      if (!h.trim()) continue;
      checkPageBreak(15);
      page.drawText(`• ${h.trim()}`, {
        x: 45,
        y,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.25, 0.35),
      });
      y -= 14;
    }
    y -= 10;
  }

  // Curriculum Modules
  if (course.curriculum && course.curriculum.length > 0) {
    checkPageBreak(50);
    page.drawText('Curriculum & Module Roadmap', {
      x: 40,
      y,
      size: 13,
      font: boldFont,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 20;

    course.curriculum.forEach((mod, idx) => {
      checkPageBreak(45);

      page.drawRectangle({
        x: 40,
        y: y - 25,
        width: width - 80,
        height: 35,
        color: rgb(0.96, 0.97, 0.98),
        borderColor: rgb(0.88, 0.9, 0.93),
        borderWidth: 1,
      });

      const modTitle = `Module ${idx + 1}: ${mod.title || 'Module'}`;
      page.drawText(modTitle.slice(0, 60), {
        x: 52,
        y: y - 12,
        size: 10.5,
        font: boldFont,
        color: rgb(0.1, 0.15, 0.22),
      });

      const details = `${mod.lessons ? `${mod.lessons} Lessons` : 'Included'} ${mod.duration ? `• ${mod.duration}` : ''}`;
      page.drawText(details, {
        x: 52,
        y: y - 23,
        size: 8.5,
        font: regularFont,
        color: rgb(0.4, 0.45, 0.55),
      });

      y -= 42;
    });
  }

  checkPageBreak(30);
  page.drawText('Official Course Syllabus • Verified by Vendor Connect Marketplace', {
    x: 40,
    y: 30,
    size: 8,
    font: regularFont,
    color: rgb(0.6, 0.65, 0.7),
  });

  return await doc.save();
}
