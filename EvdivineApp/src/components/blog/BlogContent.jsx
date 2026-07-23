import React, { useMemo } from "react";
import {
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Colors } from "../../theme/colors";
import { htmlToPlainText, sanitizeBlogHtml } from "../../utils/sanitizeBlogHtml";
import { API_BASE_URL } from "../../config/api";

const WEB_ALLOWED = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "span",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "br",
  "hr",
  "img",
  "div",
  "section",
  "article",
]);

const isSafeUrl = (value = "") => {
  const url = String(value || "").trim();
  if (!url) return false;
  return /^(https?:\/\/|mailto:|tel:|data:image\/|\/uploads\/)/i.test(url);
};

const resolveImageUrl = (value = "") => {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || /^data:image\//i.test(url)) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`;
  }
  return `${API_BASE_URL}/${url.replace(/^\/+/, "")}`;
};

const renderWebNode = (node, index = 0, compact = false) => {
  if (!node) return null;

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.replace(/\s+/g, " ") || "";
    return text.trim() ? <Text key={index}>{text}</Text> : null;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName.toLowerCase();

  if (!WEB_ALLOWED.has(tag)) {
    return Array.from(node.childNodes).map((child, childIndex) =>
      renderWebNode(child, `${index}-${childIndex}`, compact)
    );
  }

  const children = Array.from(node.childNodes)
    .map((child, childIndex) => renderWebNode(child, `${index}-${childIndex}`, compact))
    .flat()
    .filter(Boolean);

  switch (tag) {
    case "h1":
      return <Text key={index} style={[styles.h1, compact && styles.h1Compact]}>{children}</Text>;
    case "h2":
      return <Text key={index} style={[styles.h2, compact && styles.h2Compact]}>{children}</Text>;
    case "h3":
      return <Text key={index} style={[styles.h3, compact && styles.h3Compact]}>{children}</Text>;
    case "h4":
    case "h5":
    case "h6":
      return <Text key={index} style={[styles.h4, compact && styles.h4Compact]}>{children}</Text>;
    case "p":
    case "div":
    case "section":
    case "article":
      return (
        <Text key={index} style={[styles.paragraph, compact && styles.paragraphCompact]}>
          {children}
        </Text>
      );
    case "strong":
    case "b":
      return <Text key={index} style={[styles.strong, compact && styles.strongCompact]}>{children}</Text>;
    case "em":
    case "i":
      return <Text key={index} style={[styles.em, compact && styles.emCompact]}>{children}</Text>;
    case "u":
      return <Text key={index} style={[styles.underline, compact && styles.underlineCompact]}>{children}</Text>;
    case "span":
      return <Text key={index}>{children}</Text>;
    case "a": {
      const href = node.getAttribute("href") || "";
      const safeHref = isSafeUrl(href) ? href : null;
      return (
        <Text
          key={index}
          style={[styles.link, compact && styles.linkCompact]}
          onPress={() => safeHref && Linking.openURL(safeHref)}
        >
          {children}
        </Text>
      );
    }
    case "ul":
    case "ol": {
      const ordered = tag === "ol";
      const items = Array.from(node.children).filter((child) => child.tagName?.toLowerCase() === "li");

      return (
        <View key={index} style={styles.list}>
          {items.map((item, itemIndex) => (
            <View key={`${index}-li-${itemIndex}`} style={styles.listItem}>
              <Text style={[styles.bullet, compact && styles.bulletCompact]}>
                {ordered ? `${itemIndex + 1}.` : "-"}
              </Text>
              <Text style={[styles.listText, compact && styles.listTextCompact]}>
                {renderWebChildren(item, `${index}-${itemIndex}`, compact)}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    case "blockquote":
      return (
        <View key={index} style={[styles.quote, compact && styles.quoteCompact]}>
          <Text style={styles.quoteBar}>|</Text>
          <Text style={[styles.quoteText, compact && styles.quoteTextCompact]}>{children}</Text>
        </View>
      );
    case "pre":
      return (
        <View key={index} style={[styles.codeWrap, compact && styles.codeWrapCompact]}>
          <Text style={[styles.codeText, compact && styles.codeTextCompact]}>{children}</Text>
        </View>
      );
    case "code":
      return <Text key={index} style={[styles.codeInline, compact && styles.codeInlineCompact]}>{children}</Text>;
    case "br":
      return <Text key={index}>{"\n"}</Text>;
    case "hr":
      return <View key={index} style={styles.hr} />;
    case "img": {
      const src = node.getAttribute("src") || "";
      if (!isSafeUrl(src)) return null;

      const alt = node.getAttribute("alt") || "Blog image";
      return (
        <Image
          key={index}
          source={{ uri: resolveImageUrl(src) }}
          style={[styles.inlineImage, compact && styles.inlineImageCompact]}
          resizeMode="cover"
          accessibilityLabel={alt}
          {...(Platform.OS === "web" ? { loading: "lazy" } : {})}
        />
      );
    }
    default:
      return (
        <Text key={index} style={[styles.paragraph, compact && styles.paragraphCompact]}>
          {children}
        </Text>
      );
  }
};

const renderWebChildren = (node, keyPrefix = "root", compact = false) =>
  Array.from(node.childNodes)
    .map((child, index) => renderWebNode(child, `${keyPrefix}-${index}`, compact))
    .flat()
    .filter(Boolean);

export default function BlogContent({ html = "" }) {
  const { width } = useWindowDimensions();
  const compact = width < 620;
  const safeHtml = useMemo(() => sanitizeBlogHtml(html), [html]);

  if (!safeHtml) {
    return null;
  }

  if (Platform.OS !== "web" || typeof DOMParser === "undefined") {
    const plainText = htmlToPlainText(safeHtml);
    const blocks = plainText.split(/\n{2,}/).filter(Boolean);

    return (
      <View style={[styles.nativeWrap, compact && styles.nativeWrapCompact]}>
        {blocks.length > 0
          ? blocks.map((block, index) => (
              <Text key={index} style={[styles.paragraph, compact && styles.paragraphCompact]}>
                {block}
              </Text>
            ))
          : null}
      </View>
    );
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<div>${safeHtml}</div>`, "text/html");
  const root = document.body.firstElementChild;
  const nodes = root ? Array.from(root.childNodes) : [];

  return <View style={[styles.webWrap, compact && styles.webWrapCompact]}>{nodes.map((node, index) => renderWebNode(node, index, compact))}</View>;
}

const styles = StyleSheet.create({
  webWrap: {
    gap: 14,
  },
  webWrapCompact: {
    gap: 12,
  },
  nativeWrap: {
    gap: 12,
  },
  nativeWrapCompact: {
    gap: 10,
  },
  paragraph: {
    color: "rgba(78,37,19,0.88)",
    fontSize: 16,
    lineHeight: 27,
  },
  paragraphCompact: {
    fontSize: 15,
    lineHeight: 25,
  },
  h1: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 38,
  },
  h1Compact: {
    fontSize: 24,
    lineHeight: 32,
  },
  h2: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 34,
  },
  h2Compact: {
    fontSize: 21,
    lineHeight: 28,
  },
  h3: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 30,
  },
  h3Compact: {
    fontSize: 19,
    lineHeight: 26,
  },
  h4: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 26,
  },
  h4Compact: {
    fontSize: 17,
    lineHeight: 24,
  },
  strong: {
    color: Colors.text,
    fontWeight: "900",
  },
  strongCompact: {},
  em: {
    fontStyle: "italic",
  },
  emCompact: {},
  underline: {
    textDecorationLine: "underline",
  },
  underlineCompact: {},
  link: {
    color: Colors.primary,
    textDecorationLine: "underline",
    fontWeight: "800",
  },
  linkCompact: {
    fontWeight: "700",
  },
  list: {
    gap: 10,
    paddingVertical: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bullet: {
    color: Colors.primary,
    fontWeight: "900",
    fontSize: 16,
    lineHeight: 24,
    minWidth: 20,
  },
  bulletCompact: {
    fontSize: 15,
  },
  listText: {
    flex: 1,
    color: "rgba(78,37,19,0.88)",
    fontSize: 16,
    lineHeight: 26,
  },
  listTextCompact: {
    fontSize: 15,
    lineHeight: 24,
  },
  quote: {
    flexDirection: "row",
    gap: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(163,75,31,0.06)",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
  },
  quoteCompact: {
    padding: 14,
    gap: 10,
  },
  quoteBar: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 28,
  },
  quoteText: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    lineHeight: 26,
    fontStyle: "italic",
  },
  quoteTextCompact: {
    fontSize: 15,
    lineHeight: 24,
  },
  codeWrap: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#1E1B18",
  },
  codeWrapCompact: {
    padding: 14,
  },
  codeText: {
    color: "#F5E9D4",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.select({ web: "monospace", default: "monospace" }),
  },
  codeTextCompact: {
    fontSize: 13,
    lineHeight: 20,
  },
  codeInline: {
    backgroundColor: "rgba(163,75,31,0.12)",
    color: Colors.primaryDark,
    fontSize: 14,
    fontFamily: Platform.select({ web: "monospace", default: "monospace" }),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeInlineCompact: {
    fontSize: 13,
  },
  hr: {
    height: 1,
    backgroundColor: "rgba(163,75,31,0.18)",
    marginVertical: 8,
  },
  inlineImage: {
    width: "100%",
    height: 240,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSoft,
  },
  inlineImageCompact: {
    height: 180,
  },
});
