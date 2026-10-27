import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const BLACK = rgb(0.1, 0.1, 0.1);
const DARK = rgb(0.2, 0.2, 0.2);
const MUTED = rgb(0.5, 0.5, 0.5);
const GOLD = rgb(0.72, 0.58, 0.25);
const LINE = rgb(0.8, 0.8, 0.8);

export async function generateTicketPDF(billet) {
  const prixPaye = Number(billet.prix_paye) || 0;
  const prixAvant = Number(billet.prix_avant) || 0;
  const typeLabel = billet.type === 'tarif réduit'
    ? 'TARIF RÉDUIT (-25 ANS)'
    : String(billet.type || '').toUpperCase();
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([280, 740]); // Portrait, format billet
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Fine top accent line (économise l'encre)
  page.drawRectangle({
    x: 0, y: 736, width: 280, height: 4,
    color: GOLD,
  });

  // Title
  page.drawText('PRINCE', {
    x: 92, y: 702, size: 24, font: fontBold, color: BLACK,
  });
  page.drawText('10 DÉCEMBRE 2026 · 20H00', {
    x: 55, y: 682, size: 9, font: font, color: MUTED,
  });

  // Divider
  page.drawRectangle({
    x: 30, y: 662, width: 220, height: 0.5,
    color: LINE,
  });

  // Ticket number
  page.drawText('BILLET N°', {
    x: 30, y: 637, size: 8, font: font, color: MUTED,
  });
  page.drawText(billet.numero_billet, {
    x: 30, y: 620, size: 13, font: fontBold, color: BLACK,
  });

  // Name
  page.drawText('NOM', {
    x: 30, y: 587, size: 8, font: font, color: MUTED,
  });
  page.drawText(`${billet.prenom} ${billet.nom}`.toUpperCase(), {
    x: 30, y: 570, size: 13, font: fontBold, color: BLACK,
  });

  // Type
  page.drawText('TYPE', {
    x: 30, y: 537, size: 8, font: font, color: MUTED,
  });
  page.drawText(typeLabel, {
    x: 30, y: 522, size: 9, font: font, color: DARK,
  });

  // Price
  const prixFormate = prixPaye.toFixed(2).replace('.', ',');
  page.drawText('PRIX', {
    x: 150, y: 537, size: 8, font: font, color: MUTED,
  });
  page.drawText(`${prixFormate} CHF`, {
    x: 150, y: 522, size: 13, font: fontBold, color: BLACK,
  });

  // Promo info
  if (billet.code_promo && prixAvant > prixPaye) {
    const prixAvantFormate = prixAvant.toFixed(2).replace('.', ',');
    page.drawText(`Avant remise: ${prixAvantFormate} CHF`, {
      x: 150, y: 508, size: 7, font: font, color: MUTED,
    });
    page.drawText(`Code ${billet.code_promo}`, {
      x: 150, y: 497, size: 7, font: font, color: GOLD,
    });
  }

  // Divider
  page.drawRectangle({
    x: 30, y: 482, width: 220, height: 0.5,
    color: LINE,
  });

  // Venue
  page.drawText('LIEU', {
    x: 30, y: 457, size: 8, font: font, color: MUTED,
  });
  page.drawText('Salle Centrale de la Madeleine', {
    x: 30, y: 442, size: 10, font: font, color: DARK,
  });
  page.drawText('Théâtre de la Madeleine', {
    x: 30, y: 428, size: 10, font: font, color: DARK,
  });
  page.drawText('10 rue de la Madeleine', {
    x: 30, y: 413, size: 9, font: font, color: MUTED,
  });
  page.drawText('1204 Genève', {
    x: 30, y: 400, size: 9, font: font, color: MUTED,
  });

  // Schedule and seating
  page.drawText('HORAIRES ET PLACEMENT', {
    x: 30, y: 370, size: 8, font: font, color: MUTED,
  });
  page.drawText('Portes : 19h30 · Spectacle : 20h00', {
    x: 30, y: 355, size: 9, font: font, color: DARK,
  });
  page.drawText('Durée : environ 1h30', {
    x: 30, y: 341, size: 9, font: font, color: DARK,
  });
  page.drawText('400 places assises · placement libre non numéroté', {
    x: 30, y: 323, size: 7, font: font, color: MUTED,
  });

  // Divider
  page.drawRectangle({
    x: 30, y: 305, width: 220, height: 0.5,
    color: LINE,
  });

  // Access
  page.drawText('ACCÈS', {
    x: 30, y: 280, size: 8, font: font, color: MUTED,
  });
  page.drawText('Arrêt Môlard à 2 min · lignes 12, 10, 7, 2, 36', {
    x: 30, y: 265, size: 7, font: font, color: DARK,
  });
  page.drawText('Parkings Saint-Antoine, Mont-Blanc, Villereuse', {
    x: 30, y: 251, size: 7, font: font, color: MUTED,
  });
  page.drawText('Accès PMR de plain-pied', {
    x: 30, y: 233, size: 8, font: font, color: DARK,
  });
  page.drawText('Rampe sur demande auprès de la salle', {
    x: 30, y: 220, size: 7, font: font, color: MUTED,
  });

  // Divider
  page.drawRectangle({
    x: 30, y: 202, width: 220, height: 0.5,
    color: LINE,
  });

  // Bar
  page.drawText('BAR ET RESTAURATION', {
    x: 30, y: 177, size: 8, font: font, color: MUTED,
  });
  page.drawText('Le Barmad : bar et restauration indépendants', {
    x: 30, y: 162, size: 8, font: font, color: DARK,
  });
  page.drawText('Ouverts 1h avant et 1h après l\'événement', {
    x: 30, y: 148, size: 7, font: font, color: MUTED,
  });
  page.drawText('Boissons et snacks autorisés dans le théâtre', {
    x: 30, y: 134, size: 7, font: font, color: MUTED,
  });
  page.drawText('Espèces / TWINT · verre consigné : 2 CHF', {
    x: 30, y: 120, size: 7, font: font, color: MUTED,
  });

  // Footer
  page.drawText('Présentez ce billet à l\'entrée', {
    x: 30, y: 82, size: 8, font: font, color: MUTED,
  });
  page.drawText('(numérique ou papier)', {
    x: 30, y: 68, size: 8, font: font, color: MUTED,
  });

  return pdf.saveAsBase64({ dataUri: false });
}
