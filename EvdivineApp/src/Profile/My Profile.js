import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { API_BASE_URL } from "../config/api";
import { Colors, Shadows } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

const initialProfile = {
  name: "Dakash",
  email: "dakash@example.com",
  phone: "+91 98765 43210",
  gender: "Male",
  dob: "09 Sep 2003",
  birthTime: "08:30 AM",
  birthPlace: "Mirzapur, Uttar Pradesh",
  rashi: "Kanya (Virgo)",
  city: "Mirzapur, Uttar Pradesh",
};

function ProfileField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  isEdit,
  styles,
  Colors,
  onRequestEdit,
}) {
  const inputRef = useRef(null);

  const handleIconPress = () => {
    if (typeof onRequestEdit === "function") {
      onRequestEdit();
    }

    requestAnimationFrame(() => {
      inputRef.current?.focus?.();
    });
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          !isEdit && styles.disabledInputContainer,
          isEdit && styles.activeInputContainer,
        ]}
      >
        <View style={styles.inputIconBox}>
          <Ionicons
            name={icon}
            size={19}
            color={isEdit ? Colors.primary : "#9B8D82"}
          />
        </View>

        <TextInput
          ref={inputRef}
          value={value}
          editable={isEdit}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A89B91"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          selectionColor={Colors.primary}
          style={styles.input}
        />

        <TouchableOpacity
          onPress={handleIconPress}
          activeOpacity={0.75}
          hitSlop={10}
          style={styles.fieldActionBtn}
        >
          <Ionicons
            name={isEdit ? "create-outline" : "lock-closed-outline"}
            size={17}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GenderField({
  value,
  isEdit,
  styles,
  Colors,
  onRequestEdit,
  onPress,
}) {
  const displayValue = value || "Select gender";
  const isPlaceholder = !value;

  const handlePress = () => {
    if (!isEdit) {
      if (typeof onRequestEdit === "function") {
        onRequestEdit();
      }
      return;
    }

    if (typeof onPress === "function") {
      onPress();
    }
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Gender</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[
          styles.inputContainer,
          !isEdit && styles.disabledInputContainer,
          isEdit && styles.activeInputContainer,
        ]}
      >
        <View style={styles.inputIconBox}>
          <Ionicons
            name="male-female-outline"
            size={19}
            color={isEdit ? Colors.primary : "#9B8D82"}
          />
        </View>

        <Text
          style={[
            styles.input,
            isPlaceholder && styles.placeholderText,
            !isEdit && styles.readOnlyValueText,
          ]}
          numberOfLines={1}
        >
          {displayValue}
        </Text>

        <Ionicons
          name={isEdit ? "chevron-down-outline" : "lock-closed-outline"}
          size={17}
          color={Colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const MyProfile = ({ navigation }) => {
  const { authToken } = useAuth();
  const { width } = useWindowDimensions();

  const isTablet = width >= 700;
  const isDesktop = width >= 1000;

  const [profile, setProfile] = useState(initialProfile);
  const [savedProfile, setSavedProfile] = useState(initialProfile);

  const [isEdit, setIsEdit] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isGenderPickerVisible, setIsGenderPickerVisible] = useState(false);
  const genderOptions = ["Male", "Female", "Other"];

  const loadProfile = useCallback(async () => {
    if (!authToken) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const rawText = await response.text();
      let payload = null;

      if (rawText) {
        try {
          payload = JSON.parse(rawText);
        } catch {
          payload = { raw: rawText };
        }
      }

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            `Profile load failed with status ${response.status}`
        );
      }

      const user = payload?.data?.user || payload?.data || payload?.user || {};
      const nextProfile = {
        name: user?.name || initialProfile.name,
        email: user?.email || initialProfile.email,
        phone: user?.phone || initialProfile.phone,
        gender: user?.gender || initialProfile.gender,
        dob: user?.dob || user?.dateOfBirth || initialProfile.dob,
        birthTime:
          user?.birthTime || user?.timeOfBirth || initialProfile.birthTime,
        birthPlace:
          user?.birthPlace || user?.placeOfBirth || initialProfile.birthPlace,
        rashi: user?.rashi || user?.zodiacSign || initialProfile.rashi,
        city: user?.city || user?.currentCity || initialProfile.city,
      };

      setProfile(nextProfile);
      setSavedProfile(nextProfile);
    } catch (error) {
      console.log(
        "Profile load error:",
        error?.response?.data || error?.message || error
      );
    }
  }, [authToken]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (key, value) => {
    setProfile((previousProfile) => ({
      ...previousProfile,
      [key]: value,
    }));
  };

  const validateProfile = () => {
    if (!profile.name.trim()) {
      Alert.alert("Name required", "Please enter your full name.");
      return false;
    }

    if (!profile.email.trim()) {
      Alert.alert("Email required", "Please enter your email address.");
      return false;
    }

    if (!profile.phone.trim()) {
      Alert.alert("Phone required", "Please enter your phone number.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateProfile()) {
      return;
    }

    if (!authToken) {
      Alert.alert(
        "Login required",
        "Profile save karne ke liye pehle login karein."
      );
      navigation?.navigate?.("Login");
      return;
    }

    try {
      setIsSavingProfile(true);
      const response = await fetch(`${API_BASE_URL}/api/users/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(profile),
      });

      const rawText = await response.text();
      let payload = null;

      if (rawText) {
        try {
          payload = JSON.parse(rawText);
        } catch {
          payload = { raw: rawText };
        }
      }

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            `Profile update failed with status ${response.status}`
        );
      }

      const updatedUser =
        payload?.data?.user || payload?.data || payload?.user || profile;
      const nextProfile = {
        name: updatedUser?.name || profile.name,
        email: updatedUser?.email || profile.email,
        phone: updatedUser?.phone || profile.phone,
        gender: updatedUser?.gender || profile.gender,
        dob: updatedUser?.dob || updatedUser?.dateOfBirth || profile.dob,
        birthTime:
          updatedUser?.birthTime ||
          updatedUser?.timeOfBirth ||
          profile.birthTime,
        birthPlace:
          updatedUser?.birthPlace ||
          updatedUser?.placeOfBirth ||
          profile.birthPlace,
        rashi: updatedUser?.rashi || updatedUser?.zodiacSign || profile.rashi,
        city: updatedUser?.city || updatedUser?.currentCity || profile.city,
      };

      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      setIsEdit(false);

      Alert.alert(
        "Profile Updated",
        payload?.message ||
          "Your astrology profile has been updated successfully."
      );
    } catch (error) {
      Alert.alert(
        "Update failed",
        error?.message || "Profile update nahi ho saka."
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setProfile(savedProfile);
    setIsEdit(false);
  };

  const handleEditPress = () => {
    if (isEdit) {
      handleCancelEdit();
      return;
    }

    setIsEdit(true);
  };

  const handleBackPress = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.("MainTabs", { screen: "Profile" });
  };

  const handleGenderPress = () => {
    if (!isEdit) {
      setIsEdit(true);
      requestAnimationFrame(() => {
        setIsGenderPickerVisible(true);
      });
      return;
    }

    setIsGenderPickerVisible(true);
  };

  const handleGenderSelect = (gender) => {
    handleChange("gender", gender);
    setIsGenderPickerVisible(false);
  };

  const ProfileCard = () => {
    return (
      <View style={styles.profileCard}>
        <Text style={styles.profileSummaryLabel}>Profile Summary</Text>

        <Text style={styles.profileName}>
          {profile.name || "Astrology User"}
        </Text>

        <Text style={styles.profileEmail}>
          {profile.email || "Add your email address"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopScrollContent,
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerGlowOne} />
            <View style={styles.headerGlowTwo} />

            <TouchableOpacity
              style={styles.headerButton}
              activeOpacity={0.85}
              onPress={handleBackPress}
            >
              <Ionicons name="arrow-back" size={23} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={styles.headerTitleRow}>
                <Ionicons name="sparkles" size={17} color="#FFD8A8" />

                <Text style={styles.headerTitle}>MY Profile</Text>
              </View>

              <Text style={styles.headerSubtitle}>Personal details</Text>
            </View>

            <TouchableOpacity
              style={styles.headerButton}
              activeOpacity={0.85}
              onPress={handleEditPress}
            >
              <Ionicons
                name={isEdit ? "close-outline" : "create-outline"}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.mainContainer,
              isDesktop && styles.mainContainerDesktop,
            ]}
          >
            <View
              style={[
                styles.contentLayout,
                isDesktop && styles.contentLayoutDesktop,
              ]}
            >
              <View
                style={[
                  styles.leftColumn,
                  isDesktop && styles.leftColumnDesktop,
                ]}
              >
                <ProfileCard />
              </View>

              <View
                style={[
                  styles.rightColumn,
                  isDesktop && styles.rightColumnDesktop,
                ]}
              >
                <View style={styles.formCard}>
                  <View style={styles.cardHeadingRow}>
                    <View style={styles.headingTextContainer}>
                      <Text style={styles.sectionTitle}>
                        Personal Information
                      </Text>

                      <Text style={styles.sectionSubtitle}>
                        {isEdit
                          ? "Update your astrology profile details"
                          : "Tap edit button to update your profile"}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.editStatusBadge,
                        isEdit && styles.editStatusBadgeActive,
                      ]}
                    >
                      <Ionicons
                        name={isEdit ? "create-outline" : "lock-closed-outline"}
                        size={14}
                        color={isEdit ? "#FFFFFF" : Colors.primary}
                      />

                      <Text
                        style={[
                          styles.editStatusText,
                          isEdit && styles.editStatusTextActive,
                        ]}
                      >
                        {isEdit ? "Editing" : "View only"}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[styles.formGrid, isTablet && styles.formGridTablet]}
                  >
                    <View
                      style={[styles.formField, isTablet && styles.halfField]}
                    >
                      <ProfileField
                        label="Full Name"
                        icon="person-outline"
                        value={profile.name}
                        onChangeText={(text) => handleChange("name", text)}
                        placeholder="Enter your full name"
                        isEdit={isEdit}
                        styles={styles}
                        Colors={Colors}
                        onRequestEdit={() => setIsEdit(true)}
                      />
                    </View>

                    <View
                      style={[styles.formField, isTablet && styles.halfField]}
                    >
                      <ProfileField
                        label="Email Address"
                        icon="mail-outline"
                        value={profile.email}
                        onChangeText={(text) => handleChange("email", text)}
                        placeholder="Enter email address"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        isEdit={isEdit}
                        styles={styles}
                        Colors={Colors}
                        onRequestEdit={() => setIsEdit(true)}
                      />
                    </View>

                    <View
                      style={[styles.formField, isTablet && styles.halfField]}
                    >
                      <ProfileField
                        label="Phone Number"
                        icon="call-outline"
                        value={profile.phone}
                        onChangeText={(text) => handleChange("phone", text)}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                        isEdit={isEdit}
                        styles={styles}
                        Colors={Colors}
                        onRequestEdit={() => setIsEdit(true)}
                      />
                    </View>

                    <View
                      style={[styles.formField, isTablet && styles.halfField]}
                    >
                      <GenderField
                        value={profile.gender}
                        isEdit={isEdit}
                        styles={styles}
                        Colors={Colors}
                        onRequestEdit={() => setIsEdit(true)}
                        onPress={handleGenderPress}
                      />
                    </View>
                  </View>

                  <View style={styles.sectionDivider} />
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, !isEdit && styles.editButton]}
                  activeOpacity={0.88}
                  onPress={isEdit ? handleSave : () => setIsEdit(true)}
                  disabled={isSavingProfile}
                >
                  <Ionicons
                    name={
                      isEdit ? "checkmark-circle-outline" : "create-outline"
                    }
                    size={22}
                    color="#FFFFFF"
                  />

                  <Text style={styles.saveButtonText}>
                    {isSavingProfile
                      ? "Saving..."
                      : isEdit
                      ? "Save Profile"
                      : "Edit Profile"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        <Modal
          transparent
          visible={isGenderPickerVisible}
          animationType="fade"
          onRequestClose={() => setIsGenderPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.pickerBackdrop}
            activeOpacity={1}
            onPress={() => setIsGenderPickerVisible(false)}
          >
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Select Gender</Text>

              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.pickerOption,
                    profile.gender === option && styles.pickerOptionActive,
                  ]}
                  onPress={() => handleGenderSelect(option)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      profile.gender === option &&
                        styles.pickerOptionTextActive,
                    ]}
                  >
                    {option}
                  </Text>

                  {profile.gender === option ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={Colors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.pickerCancelBtn}
                onPress={() => setIsGenderPickerVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MyProfile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg || "#F7F3EE",
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 35,
  },

  desktopScrollContent: {
    alignItems: "center",
    paddingBottom: 55,
  },

  header: {
    width: "100%",
    minHeight: 105,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 18 : 12,
    paddingBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },

  headerGlowOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -90,
    right: -30,
  },

  headerGlowTwo: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,207,143,0.10)",
    bottom: -70,
    left: 25,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.17)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    marginTop: 4,
  },

  mainContainer: {
    width: "100%",
  },

  mainContainerDesktop: {
    maxWidth: 1200,
    paddingHorizontal: 20,
  },

  contentLayout: {
    width: "100%",
  },

  contentLayoutDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },

  leftColumn: {
    width: "100%",
  },

  leftColumnDesktop: {
    width: 365,
  },

  rightColumn: {
    width: "100%",
  },

  rightColumnDesktop: {
    flex: 1,
    minWidth: 0,
  },

  profileCard: {
    marginHorizontal: 16,
    marginTop: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: "flex-start",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.08)",
    ...Shadows.card,
  },

  profileSummaryLabel: {
    color: "#A34B1F",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  profileName: {
    marginTop: 0,
    color: "#1D1713",
    fontSize: 23,
    fontWeight: "900",
    textAlign: "left",
  },

  profileEmail: {
    marginTop: 5,
    color: "#81756C",
    fontSize: 13,
    textAlign: "left",
  },

  formCard: {
    marginHorizontal: 16,
    marginTop: 0,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.08)",
    ...Shadows.card,
  },

  cardHeadingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 17,
  },

  headingTextContainer: {
    flex: 1,
  },

  headingIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#FFF1E7",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: "#201A16",
    fontSize: 18,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "#8B7E74",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  editStatusBadge: {
    minHeight: 31,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#FFF2E8",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  editStatusBadgeActive: {
    backgroundColor: Colors.primary,
  },

  editStatusText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  editStatusTextActive: {
    color: "#FFFFFF",
  },

  formGrid: {
    width: "100%",
  },

  formGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },

  formField: {
    width: "100%",
  },

  halfField: {
    width: "50%",
    paddingHorizontal: 6,
  },

  inputGroup: {
    marginBottom: 14,
  },

  label: {
    color: "#5E544D",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 55,
    borderRadius: 15,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  disabledInputContainer: {
    backgroundColor: "#F8F5F2",
    borderColor: "#EDE5DE",
  },

  activeInputContainer: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(163,75,31,0.42)",
  },

  inputIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF1E7",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    color: "#221C18",
    fontSize: 14,
    marginLeft: 10,
    paddingVertical: Platform.OS === "ios" ? 13 : 9,
  },

  placeholderText: {
    color: "#A89B91",
  },

  readOnlyValueText: {
    paddingTop: 0,
    paddingBottom: 0,
  },

  fieldActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  sectionDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#EFE7E1",
    marginVertical: 6,
  },

  subSectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
  },

  subSectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFF0E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  subSectionTitle: {
    color: "#201A16",
    fontSize: 16,
    fontWeight: "900",
  },

  subSectionSubtitle: {
    color: "#8E8176",
    fontSize: 11,
    marginTop: 3,
  },

  birthEditBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  birthEditBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  pickerSheet: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 18,
    ...Shadows.card,
  },

  pickerTitle: {
    color: "#201A16",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 12,
  },

  pickerOption: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7DDD5",
    backgroundColor: "#FFF9F5",
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pickerOptionActive: {
    borderColor: "rgba(163,75,31,0.30)",
    backgroundColor: "#FFF1E7",
  },

  pickerOptionText: {
    color: "#463730",
    fontSize: 14,
    fontWeight: "700",
  },

  pickerOptionTextActive: {
    color: Colors.primary,
    fontWeight: "900",
  },

  pickerCancelBtn: {
    marginTop: 4,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  pickerCancelText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  saveButton: {
    marginHorizontal: 16,
    marginTop: 18,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Shadows.lg,
  },

  editButton: {
    opacity: 0.96,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});
