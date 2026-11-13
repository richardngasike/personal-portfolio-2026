import type { IconType } from 'react-icons';
import {
  FaBehance,
  FaDribbble,
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6';
import { FiLink } from 'react-icons/fi';

const ICONS: Record<string, IconType> = {
  github: FaGithub,
  linkedin: FaLinkedinIn,
  x: FaXTwitter,
  twitter: FaXTwitter,
  instagram: FaInstagram,
  facebook: FaFacebookF,
  youtube: FaYoutube,
  behance: FaBehance,
  dribbble: FaDribbble,
  tiktok: FaTiktok,
  whatsapp: FaWhatsapp,
};

export function SocialIcon({ platform }: { platform: string }) {
  const Icon = ICONS[platform.toLowerCase()] ?? FiLink;
  return <Icon aria-hidden="true" />;
}
