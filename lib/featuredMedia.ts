// Newly uploaded editorial drop (April 2026 batch) featured on the home
// contact-sheet. Values are Cloudinary public_ids — consumed by <CldImage>,
// which adds f_auto,q_auto and responsive widths automatically. Edit/extend
// this list to change what's featured; no component changes required.

export interface FeaturedImage {
  publicId: string;
  alt: string;
}

export const featuredImages: FeaturedImage[] = [
  { publicId: "dunks_green_jzkvee", alt: "Green Nike Dunks — new drop" },
  { publicId: "red_dunks_gakri2", alt: "Red Nike Dunks — new drop" },
  { publicId: "WhatsApp_Image_2026-04-11_at_11.13.52_AM_dmkbkz", alt: "Baywoods FW26 fit, full look" },
  { publicId: "WhatsApp_Image_2026-04-11_at_11.14.07_AM_rxmoyq", alt: "Street fit, detail shot" },
  { publicId: "WhatsApp_Image_2026-04-11_at_11.16.32_AM_s8v7yw", alt: "Layered look on location" },
  { publicId: "WhatsApp_Image_2026-04-11_at_11.21.18_AM_uho056", alt: "Sneaker pairing, on foot" },
  { publicId: "WhatsApp_Image_2026-04-12_at_3.51.58_PM_v2sp0j", alt: "Editorial portrait, golden hour" },
  { publicId: "WhatsApp_Image_2026-04-13_at_10.01.16_AM_ojvnbv", alt: "Studio still, latest arrival" },
];
