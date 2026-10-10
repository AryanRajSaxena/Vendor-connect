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

export function sanitizePdfText(text: string | undefined | null): string {
  if (!text) return '';
  return String(text)
    .replace(/₹/g, 'INR ')
    .replace(/[•●▪]/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[…]/g, '...')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

function wrapText(text: string, maxCharsPerLine: number = 75): string[] {
  if (!text) return [];
  const rawParagraphs = String(text).split(/\r?\n+/);
  const lines: string[] = [];

  for (const para of rawParagraphs) {
    const sanitized = sanitizePdfText(para);
    if (!sanitized) continue;
    const words = sanitized.split(' ').filter(Boolean);
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

export async function generateSyllabusPdfBytes(course: CoursePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let page = doc.addPage([595.28, 841.89]); // A4 standard
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
    y: y - 65,
    width: width - 80,
    height: 75,
    color: rgb(0.06, 0.09, 0.16),
  });

  // Header Title
  const courseTitle = sanitizePdfText(course.name || 'Course Syllabus');
  page.drawText(courseTitle.slice(0, 48), {
    x: 55,
    y: y - 24,
    size: 17,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  const priceTag = course.basePrice ? ` | Fee: INR ${course.basePrice}` : '';
  const subtitle = sanitizePdfText(`${course.category || 'Online Course'} | ${course.courseDuration || 'Self-paced'}${priceTag}`);
  page.drawText(subtitle, {
    x: 55,
    y: y - 44,
    size: 10,
    font: regularFont,
    color: rgb(0.2, 0.78, 0.55),
  });

  page.drawText('OFFICIAL COURSE SYLLABUS & BROCHURE', {
    x: 55,
    y: y - 58,
    size: 7.5,
    font: boldFont,
    color: rgb(0.55, 0.65, 0.75),
  });

  y -= 90;

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
      const cleanH = sanitizePdfText(h);
      if (!cleanH) continue;
      checkPageBreak(15);
      page.drawText(`- ${cleanH}`, {
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

  // What You'll Learn (Learning Outcomes)
  if (course.learningOutcomes && course.learningOutcomes.length > 0) {
    checkPageBreak(50);
    page.drawText("What You'll Learn (Learning Outcomes)", {
      x: 40,
      y,
      size: 13,
      font: boldFont,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 18;

    for (const outcome of course.learningOutcomes) {
      const cleanOutcome = sanitizePdfText(outcome);
      if (!cleanOutcome) continue;
      const wrapped = wrapText(cleanOutcome, 75);
      for (let i = 0; i < wrapped.length; i++) {
        checkPageBreak(15);
        page.drawText(i === 0 ? `+ ${wrapped[i]}` : `  ${wrapped[i]}`, {
          x: 45,
          y,
          size: 9.5,
          font: regularFont,
          color: rgb(0.18, 0.22, 0.32),
        });
        y -= 14;
      }
    }
    y -= 10;
  }

  // Prerequisites & Requirements
  if (course.prerequisites && course.prerequisites.length > 0) {
    checkPageBreak(50);
    page.drawText('Prerequisites & Requirements', {
      x: 40,
      y,
      size: 13,
      font: boldFont,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 18;

    for (const prereq of course.prerequisites) {
      const cleanPrereq = sanitizePdfText(prereq);
      if (!cleanPrereq) continue;
      const wrapped = wrapText(cleanPrereq, 75);
      for (let i = 0; i < wrapped.length; i++) {
        checkPageBreak(15);
        page.drawText(i === 0 ? `- ${wrapped[i]}` : `  ${wrapped[i]}`, {
          x: 45,
          y,
          size: 9.5,
          font: regularFont,
          color: rgb(0.25, 0.3, 0.38),
        });
        y -= 14;
      }
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

      const rawTitle = `Module ${idx + 1}: ${mod.title || 'Module'}`;
      const modTitle = sanitizePdfText(rawTitle);
      page.drawText(modTitle.slice(0, 60), {
        x: 52,
        y: y - 12,
        size: 10.5,
        font: boldFont,
        color: rgb(0.1, 0.15, 0.22),
      });

      const rawDetails = `${mod.lessons ? `${mod.lessons} Lessons` : 'Included'} ${mod.duration ? `- ${mod.duration}` : ''}`;
      const details = sanitizePdfText(rawDetails);
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
  page.drawText('Official Course Syllabus - Verified by Vendor Connect Marketplace', {
    x: 40,
    y: 30,
    size: 8,
    font: regularFont,
    color: rgb(0.6, 0.65, 0.7),
  });

  return await doc.save();
}
