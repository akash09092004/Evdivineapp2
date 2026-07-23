import React, { useMemo, useState } from "react";
import { Alert, Linking, Platform, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DEFAULT_OFFICE_ADDRESS =
  "Jyotish Sadan, 9/959, Sector 9, Vasundhara, Ghaziabad, Uttar Pradesh 201012, India";

const openExternalLink = (url) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    return Promise.resolve();
  }

  return Linking.openURL(url).catch(() => {
    Alert.alert("Error", "Link open nahi ho raha");
  });
};

const buildSearchUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const buildDirectionsUrl = (address, currentLocation) => {
  const destination = encodeURIComponent(address);
  if (currentLocation) {
    return `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destination}&travelmode=driving`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
};

const requestCurrentLocation = () =>
  new Promise((resolve, reject) => {
    const geo = typeof navigator !== "undefined" ? navigator.geolocation : null;

    if (!geo?.getCurrentPosition) {
      reject(new Error("Is browser/device par geolocation supported nahi hai."));
      return;
    }

    geo.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        const message =
          error?.code === 1
            ? "Location permission denied. Use My Location ke liye permission allow karein."
            : error?.code === 2
              ? "GPS ya location service off hai. Please location on karke try karein."
              : error?.code === 3
                ? "Location request timeout ho gaya. Please dobara try karein."
                : "Location fetch nahi ho paayi. Please dobara try karein.";
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });

export default function OfficeLocationSection({
  styles,
  mapBoxStyle,
  compactActionStyle,
  address = DEFAULT_OFFICE_ADDRESS,
  title = "Find Us On Map",
  titleIcon = "location-outline",
}) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationReady, setLocationReady] = useState(false);

  const searchUrl = useMemo(() => buildSearchUrl(address), [address]);

  const handleOpenGoogleMaps = () => {
    void openExternalLink(searchUrl);
  };

  const handleUseMyLocation = async () => {
    if (locationLoading) return;

    setLocationLoading(true);
    setLocationError("");

    try {
      const location = await requestCurrentLocation();
      setCurrentLocation(location);
      setLocationReady(true);
      return location;
    } catch (error) {
      setCurrentLocation(null);
      setLocationReady(false);
      setLocationError(error?.message || "Location fetch nahi ho paayi. Please dobara try karein.");
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const handleGetDirections = async () => {
    if (locationLoading) return;

    let location = currentLocation;
    if (!location) {
      location = await handleUseMyLocation();
    }

    if (!location) {
      return;
    }

    void openExternalLink(buildDirectionsUrl(address, location));
  };

  return (
    <View style={styles.whiteBox}>
      <View style={styles.titleRow}>
        <Ionicons name={titleIcon} size={22} color="#C06A3B" />
        <Text style={styles.boxTitle}>{title}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.mapBox, mapBoxStyle]}
        onPress={handleOpenGoogleMaps}
      >
        <Ionicons name="map" size={70} color="#C06A3B" />
      </TouchableOpacity>

      <View style={styles.mapActions}>
        <TouchableOpacity
          style={[styles.mapActionBtn, styles.mapActionPrimary, compactActionStyle]}
          onPress={handleOpenGoogleMaps}
          activeOpacity={0.85}
        >
          <Ionicons name="open-outline" size={16} color="#fff" />
          <Text style={styles.mapActionPrimaryText}>Open in Google Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapActionBtn, styles.mapActionSoft, compactActionStyle]}
          onPress={handleUseMyLocation}
          activeOpacity={0.85}
          disabled={locationLoading}
        >
          <Ionicons name="locate-outline" size={16} color="#C06A3B" />
          <Text style={styles.mapActionSoftText}>
            {locationLoading ? "Locating..." : "Use My Location"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapActionBtn, styles.mapActionSoft, compactActionStyle]}
          onPress={handleGetDirections}
          activeOpacity={0.85}
          disabled={locationLoading}
        >
          <Ionicons name="navigate-outline" size={16} color="#C06A3B" />
          <Text style={styles.mapActionSoftText}>Get Directions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.locationNoteBox}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#C06A3B" />
        <Text style={styles.locationNoteText}>
          Location is requested only when you tap Use My Location.
        </Text>
      </View>

      {locationReady && currentLocation ? (
        <View style={styles.locationResultBox}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#31B65D" />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationResultText}>
              Current location ready. Directions can use your live coordinates now.
            </Text>
            <Text style={[styles.locationResultText, { fontSize: 10, fontWeight: "600" }]}>
              {`Lat: ${currentLocation.latitude.toFixed(5)} | Lng: ${currentLocation.longitude.toFixed(
                5
              )} | Accuracy: ${Math.round(Number(currentLocation.accuracy || 0))}m`}
            </Text>
          </View>
        </View>
      ) : null}

      {locationError ? (
        <View
          style={[
            styles.locationNoteBox,
            { marginTop: 10, backgroundColor: "rgba(220, 38, 38, 0.08)", borderColor: "rgba(220, 38, 38, 0.18)" },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
          <Text style={[styles.locationNoteText, { color: "#991B1B" }]}>{locationError}</Text>
        </View>
      ) : null}
    </View>
  );
}
