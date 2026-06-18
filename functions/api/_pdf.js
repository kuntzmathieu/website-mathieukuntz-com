import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const BG = rgb(0.039, 0.039, 0.078);
const GOLD = rgb(0.91, 0.78, 0.42);
const WHITE = rgb(0.949, 0.937, 0.918);
const MUTED = rgb(0.5, 0.5, 0.6);

export async function generateTicketPDF(billet) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 220]); // A4 landscape, slim ticket
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Background
  page.drawRectangle({
    x: 0, y: 0, width: 595, height: 220,
    color: BG,
  });

  // Gold accent line
  page.drawRectangle({
    x: 0, y: 214, width: 595, height: 6,
    color: GOLD,
  });

  // Title
  page.drawText('PRINCE', {
    x: 30, y: 180, size: 28, font: fontBold, color: GOLD,
  });
  page.drawText('SPECTACLE — 11 JUILLET 2026', {
    x: 30, y: 160, size: 9, font: font, color: MUTED,
  });

  // Ticket number
  page.drawText('BILLET N°', {
    x: 30, y: 130, size: 8, font: font, color: MUTED,
  });
  page.drawText(billet.numero_billet, {
    x: 30, y: 115, size: 14, font: fontBold, color: WHITE,
  });

  // Name
  page.drawText('NOM', {
    x: 220, y: 130, size: 8, font: font, color: MUTED,
  });
  page.drawText(`${billet.prenom} ${billet.nom}`.toUpperCase(), {
    x: 220, y: 115, size: 14, font: fontBold, color: WHITE,
  });

  // Type
  page.drawText('TYPE', {
    x: 220, y: 85, size: 8, font: font, color: MUTED,
  });
  page.drawText(billet.type.toUpperCase(), {
    x: 220, y: 70, size: 11, font: font, color: WHITE,
  });

  // Price
  page.drawText('PRIX', {
    x: 400, y: 85, size: 8, font: font, color: MUTED,
  });
  page.drawText(`${billet.prix_paye}€`, {
    x: 400, y: 70, size: 14, font: fontBold, color: GOLD,
  });

  // Venue
  page.drawText('LIEU', {
    x: 400, y: 130, size: 8, font: font, color: MUTED,
  });
  page.drawText('Théâtre Vif', {
    x: 400, y: 115, size: 11, font: font, color: WHITE,
  });
  page.drawText('Paris', {
    x: 400, y: 100, size: 9, font: font, color: MUTED,
  });

  // Footer
  page.drawText('Présentez ce billet à l\'entrée · Échangeable au theatre-le-vif.com', {
    x: 30, y: 20, size: 8, font: font, color: MUTED,
  });

  return pdf.saveAsBase64({ dataUri: false });
}
