import Article from "@mui/icons-material/Article";
import BrokenImage from "@mui/icons-material/BrokenImage";
import HeadphonesTwoTone from "@mui/icons-material/HeadphonesTwoTone";
import HelpOutline from "@mui/icons-material/HelpOutline";
import Image from "@mui/icons-material/Image";
import LanguageTwoTone from "@mui/icons-material/LanguageTwoTone";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
import OndemandVideo from "@mui/icons-material/OndemandVideo";
import { Typography } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { useCallback, useEffect, useState } from "react";

const SIZES = {
  default: 102,
  small: 77,
  large: 252,
};

const THUMBNAIL_MEDIA_TYPES = ["Document", "Image", "Video"];

const MEDIA_TYPE_ICONS = {
  Document: Article,
  Image: Image,
  Video: OndemandVideo,
  Audio: HeadphonesTwoTone,
  Website: LanguageTwoTone,
  Other: HelpOutline,
};

export function NotDigitizedThumbnail({ width = 75, sx, ...props }) {
  const fontSize = width <= SIZES.small ? width * 0.2 : width >= SIZES.large ? 44 : undefined;
  return (
    <Avatar
      sx={{
        width: "100%",
        height: width,
        textAlign: "center",
        padding: 1,
        paddingBottom: "45%",
        alignItems: "center",
        ...sx,
      }}
      variant="rounded"
      {...props}
    >
      <Typography
        variant="body1"
        color="textSecondary"
        sx={{
          lineHeight: 1.2,
          fontStyle: "italic",
          fontSize,
        }}
      >
        Not Digitized
      </Typography>
    </Avatar>
  );
}

export function MediaTypeBadge({ media_type, width, sx }) {
  const Icon = MEDIA_TYPE_ICONS[media_type];
  if (!Icon) return null;
  return (
    <Box
      sx={{
        display: "flex",
        position: "absolute",
        bottom: "2px",
        right: "2px",
        backgroundColor: "primary.main",
        opacity: 0.8,
        ...sx,
      }}
    >
      <Icon sx={{ color: "white", width: width / 2.5, height: width / 2.5 }} />
    </Box>
  );
}

export default function Thumbnail({ item, src: _src, width = 75, alt = "", type: _type, sx, ...props }) {
  // const border = `${BORDER_SIZE}px solid rgba(0, 0, 0, 0.1)`;
  const outline = `1px solid rgba(0, 0, 0, 0.2)`;

  const [brokenLink, setBrokenLink] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setBrokenLink(false);
  }, [item?.date_modified]);

  useEffect(() => setMounted(true), []);

  const onError = useCallback((_e) => {
    setBrokenLink(true);
  }, []);

  const type =
    _type ?? (item?.record_id != null ? "record" : null) ?? (item?.collection_id != null ? "collection" : null);

  let src = _src;
  const media_type = item?.record_type;

  const size = width >= SIZES.default * 1.2 ? "_large" : width <= SIZES.default * 0.8 ? "_small" : "";

  if (!src && (item?.thumbnail || item?.has_digital || item?.url || item?.primary_media_url)) {
    const cache_buster = item?.date_modified ? `?${item?.date_modified}` : "";
    src = `/images/thumbnails/${type}s/${item[`${type}_id`]}${size}.jpg${cache_buster}`;
  }

  const recordNeedsIcon = type === "record" && !THUMBNAIL_MEDIA_TYPES.includes(media_type) && !!src;
  const collectionNeedsIcon = type === "collection" && !src;
  const show_icon = !mounted || brokenLink || recordNeedsIcon || collectionNeedsIcon;
  // console.log({
  //   item,
  //   type,
  //   media_type,
  //   recordNeedsIcon,
  //   collectionNeedsIcon,
  //   show_icon,
  //   src,
  //   mounted,
  //   brokenLink,
  //   url: item?.url || item?.primary_media_url,
  // });

  if (show_icon) {
    const Icon =
      (type === "record" && MEDIA_TYPE_ICONS[media_type]) || (type === "collection" && LibraryBooks) || BrokenImage;
    const bgcolor = Icon === BrokenImage ? undefined : "primary.main";
    return (
      <Avatar sx={{ width, height: width, bgcolor, borderRadius: 1, ...sx }} variant="rounded" {...props}>
        <Icon style={{ fontSize: width * 0.8 }} />
      </Avatar>
    );
  }

  return (
    <Box
      sx={{
        width,
        minWidth: width,
        outline,
        display: "inline-flex",
        position: "relative",
        borderRadius: src ? 0 : 1,
        ...sx,
      }}
      {...props}
    >
      {src ? (
        <img
          style={{
            objectFit: "contain",
            width: "100%",
          }}
          src={src}
          onError={onError}
          alt={alt}
        />
      ) : (
        <NotDigitizedThumbnail width={width} />
      )}
      <MediaTypeBadge media_type={media_type} width={width} sx={{ opacity: src ? 0.8 : 1 }} />
    </Box>
  );
}
