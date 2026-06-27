
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import API from "../../api";
type ProfessionalType = "Psychiatrist" | "Child Psychiatrist" | "Psychologist" | "Child Psychologist" | "Behavioral Specialist";
type DocumentKey = "nationalIdFront" | "nationalIdBack" | "practiceLicense" | "syndicateCard" | "graduationCertificate" | "specializationCertificate" | "selfie";
type UploadSource = "camera" | "gallery" | "file" | "server";
type UploadedFile = {
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
    source: UploadSource;
};
type UploadedDocuments = Partial<Record<DocumentKey, UploadedFile>>;
type ServerDocuments = Partial<Record<DocumentKey, string>>;
type DocumentRequirement = {
    key: DocumentKey;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBackground: string;
    required: boolean;
    allowPdf: boolean;
};
type GetDocumentsResponse = {
    documents: ServerDocuments;
    verificationStatus?: string;
    verificationStep?: string;
};
type UploadDocumentsResponse = {
    message: string;
    nextStep: string;
    verificationStatus: string;
    verificationStep: string;
    documents: ServerDocuments;
};
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const STORAGE_KEYS = {
    verificationToken: "verificationToken",
    professionalType: "verificationProfessionalType",
    documents: "verificationDocuments",
    status: "verificationStatus",
    currentStep: "verificationCurrentStep",
};
const getRequestErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        return String(error.response?.data?.msg ||
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Could not upload the documents.");
    }
    return error instanceof Error
        ? error.message
        : "Could not upload the documents.";
};
const getFileNameFromUrl = (url: string, key: DocumentKey): string => {
    try {
        const cleanUrl = url.split("?")[0];
        const lastPart = cleanUrl.split("/").pop() ||
            `${key}-uploaded`;
        return decodeURIComponent(lastPart);
    }
    catch {
        return `${key}-uploaded`;
    }
};
const getMimeTypeFromUrl = (url: string): string => {
    const cleanUrl = url
        .split("?")[0]
        .toLowerCase();
    if (cleanUrl.endsWith(".pdf")) {
        return "application/pdf";
    }
    if (cleanUrl.endsWith(".png")) {
        return "image/png";
    }
    if (cleanUrl.endsWith(".jpg") ||
        cleanUrl.endsWith(".jpeg")) {
        return "image/jpeg";
    }
    return "image/jpeg";
};
const convertServerDocuments = (serverDocuments?: ServerDocuments): UploadedDocuments => {
    const convertedDocuments: UploadedDocuments = {};
    if (!serverDocuments) {
        return convertedDocuments;
    }
    (Object.keys(serverDocuments) as DocumentKey[]).forEach((key) => {
        const url = serverDocuments[key];
        if (!url) {
            return;
        }
        convertedDocuments[key] = {
            uri: url,
            name: getFileNameFromUrl(url, key),
            mimeType: getMimeTypeFromUrl(url),
            source: "server",
        };
    });
    return convertedDocuments;
};
export default function VerificationDocumentsScreen() {
    const [verificationToken, setVerificationToken,] = useState("");
    const [professionalType, setProfessionalType,] = useState<ProfessionalType | null>(null);
    const [documents, setDocuments] = useState<UploadedDocuments>({});
    const [activeDocumentKey, setActiveDocumentKey,] = useState<DocumentKey | null>(null);
    const [uploadModalVisible, setUploadModalVisible,] = useState(false);
    const [initialLoading, setInitialLoading,] = useState(true);
    const [saving, setSaving] = useState(false);
    const [processingFile, setProcessingFile,] = useState(false);
    const [missingDocuments, setMissingDocuments,] = useState<DocumentKey[]>([]);
    const requiresSyndicateCard = useMemo(() => {
        return (professionalType ===
            "Psychiatrist" ||
            professionalType ===
                "Child Psychiatrist");
    }, [professionalType]);
    const documentRequirements = useMemo<DocumentRequirement[]>(() => {
        return [
            {
                key: "nationalIdFront",
                title: "National ID – Front",
                description: "Upload a clear photo of the front side of your National ID.",
                icon: "card-outline",
                iconColor: "#5D9ED5",
                iconBackground: "#EAF5FF",
                required: true,
                allowPdf: false,
            },
            {
                key: "nationalIdBack",
                title: "National ID – Back",
                description: "Upload a clear photo of the back side of your National ID.",
                icon: "card-outline",
                iconColor: "#5D9ED5",
                iconBackground: "#EAF5FF",
                required: true,
                allowPdf: false,
            },
            {
                key: "practiceLicense",
                title: "Practice License",
                description: "Upload your valid professional practice license.",
                icon: "medkit-outline",
                iconColor: "#E98D94",
                iconBackground: "#FFF0F1",
                required: true,
                allowPdf: true,
            },
            {
                key: "syndicateCard",
                title: "Syndicate Card",
                description: requiresSyndicateCard
                    ? "Upload your valid syndicate membership card."
                    : "Upload your professional syndicate card if applicable.",
                icon: "shield-checkmark-outline",
                iconColor: "#AF78C5",
                iconBackground: "#F7EDFC",
                required: requiresSyndicateCard,
                allowPdf: true,
            },
            {
                key: "graduationCertificate",
                title: "Graduation Certificate",
                description: "Upload your university graduation certificate.",
                icon: "school-outline",
                iconColor: "#49AA65",
                iconBackground: "#EAF8EE",
                required: true,
                allowPdf: true,
            },
            {
                key: "specializationCertificate",
                title: "Specialization Certificate",
                description: "Upload a certificate that proves your professional specialization.",
                icon: "ribbon-outline",
                iconColor: "#E49A4E",
                iconBackground: "#FFF6E9",
                required: true,
                allowPdf: true,
            },
            {
                key: "selfie",
                title: "Recent Selfie",
                description: "Take a clear recent photo of yourself for identity matching.",
                icon: "person-circle-outline",
                iconColor: "#5598CE",
                iconBackground: "#EAF5FF",
                required: true,
                allowPdf: false,
            },
        ];
    }, [requiresSyndicateCard]);
    const activeRequirement = useMemo(() => {
        return documentRequirements.find((item) => item.key === activeDocumentKey);
    }, [
        activeDocumentKey,
        documentRequirements,
    ]);
    const requiredDocuments = useMemo(() => {
        return documentRequirements.filter((item) => item.required);
    }, [documentRequirements]);
    const uploadedRequiredCount = useMemo(() => {
        return requiredDocuments.filter((item) => documents[item.key]).length;
    }, [documents, requiredDocuments]);
    const allRequiredUploaded = uploadedRequiredCount ===
        requiredDocuments.length;
    const persistDocuments = async (nextDocuments: UploadedDocuments) => {
        await AsyncStorage.setItem(STORAGE_KEYS.documents, JSON.stringify(nextDocuments));
    };
    useEffect(() => {
        loadSavedDocuments();
    }, []);
    const loadSavedDocuments = async () => {
        try {
            const storedValues = await AsyncStorage.multiGet([
                "role",
                STORAGE_KEYS.verificationToken,
                STORAGE_KEYS.professionalType,
                STORAGE_KEYS.documents,
            ]);
            const savedData = Object.fromEntries(storedValues) as Record<string, string | null>;
            const savedRole = savedData.role;
            const token = savedData[STORAGE_KEYS.verificationToken] || "";
            const savedProfessionalType = savedData[STORAGE_KEYS.professionalType];
            if (savedRole !== "doctor") {
                router.replace("/role-selection" as Href);
                return;
            }
            if (!token) {
                Alert.alert("Session expired", "Please login again to continue your professional verification.");
                router.replace("/auth/login" as Href);
                return;
            }
            setVerificationToken(token);
            setProfessionalType((savedProfessionalType as ProfessionalType) ||
                "Child Psychiatrist");
            let localDocuments: UploadedDocuments = {};
            const savedDocuments = savedData[STORAGE_KEYS.documents];
            if (savedDocuments) {
                try {
                    localDocuments = JSON.parse(savedDocuments) as UploadedDocuments;
                    setDocuments(localDocuments);
                }
                catch (parseError) {
                    console.log("Failed to parse saved documents:", parseError);
                }
            }
            const response = await API.get<GetDocumentsResponse>("/auth/doctor-verification/documents", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const serverDocuments = convertServerDocuments(response.data.documents);
            /*
              لو فيه ملف جديد اختاره الطبيب
              محليًا ولم يرفعه بعد، نخليه
              بدل النسخة القديمة الموجودة
              على السيرفر.
            */
            const mergedDocuments: UploadedDocuments = {
                ...serverDocuments,
            };
            (Object.keys(localDocuments) as DocumentKey[]).forEach((key) => {
                const localFile = localDocuments[key];
                if (localFile &&
                    localFile.source !== "server") {
                    mergedDocuments[key] =
                        localFile;
                }
            });
            setDocuments(mergedDocuments);
            await AsyncStorage.multiSet([
                [
                    STORAGE_KEYS.documents,
                    JSON.stringify(mergedDocuments),
                ],
                [
                    STORAGE_KEYS.status,
                    response.data
                        .verificationStatus ||
                        "draft",
                ],
                [
                    STORAGE_KEYS.currentStep,
                    response.data
                        .verificationStep ||
                        "documents",
                ],
            ]);
            if (response.data.verificationStatus ===
                "pending") {
                router.replace("/doctor/doctor-verification/pending" as Href);
                return;
            }
            if (response.data.verificationStatus ===
                "approved") {
                router.replace("/doctor/doctor-verification/approved" as Href);
            }
        }
        catch (error) {
            console.log("FAILED TO LOAD VERIFICATION DOCUMENTS:", error);
            if (axios.isAxiosError(error) &&
                (error.response?.status === 401 ||
                    error.response?.status === 403)) {
                await AsyncStorage.removeItem(STORAGE_KEYS.verificationToken);
                Alert.alert("Session expired", "Please login again to continue your professional verification.");
                router.replace("/auth/login" as Href);
                return;
            }
            Alert.alert("Loading failed", getRequestErrorMessage(error));
        }
        finally {
            setInitialLoading(false);
        }
    };
    const openUploadOptions = (key: DocumentKey) => {
        if (saving || processingFile) {
            return;
        }
        setActiveDocumentKey(key);
        setUploadModalVisible(true);
    };
    const closeUploadOptions = () => {
        if (processingFile) {
            return;
        }
        setUploadModalVisible(false);
        setActiveDocumentKey(null);
    };
    const validateFileSize = (size?: number): boolean => {
        if (!size) {
            return true;
        }
        if (size > MAX_FILE_SIZE) {
            Alert.alert("File is too large", "The maximum allowed file size is 5 MB.");
            return false;
        }
        return true;
    };
    const saveUploadedFile = (key: DocumentKey, file: UploadedFile) => {
        if (!validateFileSize(file.size)) {
            return;
        }
        setDocuments((currentDocuments) => {
            const nextDocuments = {
                ...currentDocuments,
                [key]: file,
            };
            persistDocuments(nextDocuments).catch((error) => {
                console.log("Failed to cache selected document:", error);
            });
            return nextDocuments;
        });
        setMissingDocuments((currentMissing) => currentMissing.filter((missingKey) => missingKey !== key));
        setUploadModalVisible(false);
        setActiveDocumentKey(null);
    };
    const takePhoto = async () => {
        if (!activeDocumentKey ||
            processingFile) {
            return;
        }
        try {
            setProcessingFile(true);
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Camera permission required", "Please allow camera access to take a photo.");
                return;
            }
            const isSelfie = activeDocumentKey === "selfie";
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ["images"],
                allowsEditing: isSelfie,
                aspect: isSelfie
                    ? [1, 1]
                    : undefined,
                quality: 0.9,
            });
            if (result.canceled ||
                !result.assets?.[0]) {
                return;
            }
            const asset = result.assets[0];
            saveUploadedFile(activeDocumentKey, {
                uri: asset.uri,
                name: asset.fileName ||
                    `${activeDocumentKey}-${Date.now()}.jpg`,
                mimeType: asset.mimeType ||
                    "image/jpeg",
                size: asset.fileSize,
                source: "camera",
            });
        }
        catch (error) {
            console.log("Camera upload error:", error);
            Alert.alert("Camera error", "We could not take the photo. Please try again.");
        }
        finally {
            setProcessingFile(false);
        }
    };
    const choosePhoto = async () => {
        if (!activeDocumentKey ||
            processingFile) {
            return;
        }
        try {
            setProcessingFile(true);
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Photo permission required", "Please allow access to your photos.");
                return;
            }
            const isSelfie = activeDocumentKey === "selfie";
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: isSelfie,
                aspect: isSelfie
                    ? [1, 1]
                    : undefined,
                quality: 0.9,
            });
            if (result.canceled ||
                !result.assets?.[0]) {
                return;
            }
            const asset = result.assets[0];
            saveUploadedFile(activeDocumentKey, {
                uri: asset.uri,
                name: asset.fileName ||
                    `${activeDocumentKey}-${Date.now()}.jpg`,
                mimeType: asset.mimeType ||
                    "image/jpeg",
                size: asset.fileSize,
                source: "gallery",
            });
        }
        catch (error) {
            console.log("Photo picker error:", error);
            Alert.alert("Photo selection failed", "We could not select the photo.");
        }
        finally {
            setProcessingFile(false);
        }
    };
    const chooseFile = async () => {
        if (!activeDocumentKey ||
            !activeRequirement?.allowPdf ||
            processingFile) {
            return;
        }
        try {
            setProcessingFile(true);
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    "image/*",
                    "application/pdf",
                ],
                multiple: false,
                copyToCacheDirectory: true,
            });
            if (result.canceled ||
                !result.assets?.[0]) {
                return;
            }
            const asset = result.assets[0];
            saveUploadedFile(activeDocumentKey, {
                uri: asset.uri,
                name: asset.name,
                mimeType: asset.mimeType ||
                    "application/octet-stream",
                size: asset.size,
                source: "file",
            });
        }
        catch (error) {
            console.log("Document picker error:", error);
            Alert.alert("File selection failed", "We could not select the document.");
        }
        finally {
            setProcessingFile(false);
        }
    };
    const removeDocument = (key: DocumentKey, title: string) => {
        Alert.alert("Remove document", `Are you sure you want to remove ${title}?`, [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Remove",
                style: "destructive",
                onPress: () => {
                    setDocuments((currentDocuments) => {
                        const nextDocuments = {
                            ...currentDocuments,
                        };
                        delete nextDocuments[key];
                        persistDocuments(nextDocuments).catch((error) => {
                            console.log("Failed to update cached documents:", error);
                        });
                        return nextDocuments;
                    });
                },
            },
        ]);
    };
    const handleContinue = async () => {
        if (saving || processingFile) {
            return;
        }
        const missingRequiredDocuments = requiredDocuments
            .filter((item) => !documents[item.key])
            .map((item) => item.key);
        if (missingRequiredDocuments.length >
            0) {
            setMissingDocuments(missingRequiredDocuments);
            Alert.alert("Documents required", "Please upload all required documents before continuing.");
            return;
        }
        if (!verificationToken) {
            Alert.alert("Session expired", "Please login again to continue your professional verification.");
            router.replace("/auth/login" as Href);
            return;
        }
        try {
            setSaving(true);
            const formData = new FormData();
            let newFilesCount = 0;
            (Object.keys(documents) as DocumentKey[]).forEach((key) => {
                const file = documents[key];
                if (!file ||
                    file.source === "server") {
                    return;
                }
                formData.append(key, {
                    uri: file.uri,
                    name: file.name ||
                        `${key}-${Date.now()}`,
                    type: file.mimeType ||
                        "application/octet-stream",
                } as any);
                newFilesCount += 1;
            });
            /*
              يجعل الطلب FormData صحيحًا
              حتى لو كانت كل الملفات موجودة
              بالفعل على السيرفر.
            */
            formData.append("keepExisting", "true");
            console.log("UPLOADING DOCTOR DOCUMENTS:", {
                newFilesCount,
                totalDocuments: Object.keys(documents).length,
            });
            const response = await API.put<UploadDocumentsResponse>("/auth/doctor-verification/documents", formData, {
                headers: {
                    Authorization: `Bearer ${verificationToken}`,
                    "Content-Type": "multipart/form-data",
                },
                timeout: 120000,
                transformRequest: (data) => data,
            });
            const uploadedDocuments = convertServerDocuments(response.data.documents);
            setDocuments(uploadedDocuments);
            setMissingDocuments([]);
            await AsyncStorage.multiSet([
                [
                    STORAGE_KEYS.documents,
                    JSON.stringify(uploadedDocuments),
                ],
                [
                    STORAGE_KEYS.status,
                    response.data
                        .verificationStatus ||
                        "draft",
                ],
                [
                    STORAGE_KEYS.currentStep,
                    response.data.nextStep ||
                        response.data
                            .verificationStep ||
                        "review",
                ],
            ]);
            router.push("/doctor/doctor-verification/review" as Href);
        }
        catch (error) {
            console.log("FAILED TO UPLOAD VERIFICATION DOCUMENTS:", error);
            if (axios.isAxiosError(error) &&
                (error.response?.status === 401 ||
                    error.response?.status === 403)) {
                await AsyncStorage.removeItem(STORAGE_KEYS.verificationToken);
                Alert.alert("Session expired", "Please login again to continue your professional verification.");
                router.replace("/auth/login" as Href);
                return;
            }
            const serverMissingDocuments = axios.isAxiosError(error)
                ? error.response?.data
                    ?.missingDocuments
                : undefined;
            if (Array.isArray(serverMissingDocuments)) {
                setMissingDocuments(serverMissingDocuments as DocumentKey[]);
            }
            Alert.alert("Upload failed", getRequestErrorMessage(error));
        }
        finally {
            setSaving(false);
        }
    };
    if (initialLoading) {
        return (<SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>

        <LinearGradient colors={[
                "#EEF7FF",
                "#FFF5F6",
                "#FFFFFF",
            ]} locations={[0, 0.38, 0.72]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.18 }} style={styles.background}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8DC0F0"/>

            <Text style={styles.loadingText}>
              Loading your documents...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>);
    }
    return (<SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>

      <LinearGradient colors={[
            "#EEF7FF",
            "#FFF5F6",
            "#FFFFFF",
        ]} locations={[0, 0.38, 0.72]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.18 }} style={styles.background}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBackButton} activeOpacity={0.7} onPress={() => router.back()} disabled={saving}>
              <Ionicons name="chevron-back" size={24} color="#1F2937"/>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Upload Documents
            </Text>

            <View style={styles.headerPlaceholder}/>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressStep}>
                Step 3 of 4
              </Text>

              <Text style={styles.progressPercentage}>
                75%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <LinearGradient colors={["#8DC0F0", "#F9A8A7"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.progressFill}/>
            </View>
          </View>

          {/* Introduction */}
          <View style={styles.introduction}>
            <LinearGradient colors={["#DCEFFF", "#FFE5E6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.introductionIcon}>
              <Ionicons name="cloud-upload-outline" size={30} color="#6B9CC6"/>
            </LinearGradient>

            <View style={styles.introductionContent}>
              <Text style={styles.pageTitle}>
                Upload your documents
              </Text>

              <Text style={styles.pageSubtitle}>
                Upload clear and valid documents to
                confirm your professional identity.
              </Text>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsTitleRow}>
              <Ionicons name="information-circle-outline" size={20} color="#658FB3"/>

              <Text style={styles.instructionsTitle}>
                Before uploading
              </Text>
            </View>

            <Text style={styles.instructionText}>
              • Make sure all document corners are visible.
            </Text>

            <Text style={styles.instructionText}>
              • Avoid blurry images, shadows and reflections.
            </Text>

            <Text style={styles.instructionText}>
              • Accepted formats: JPG, PNG and PDF.
            </Text>

            <Text style={styles.instructionText}>
              • Maximum size: 5 MB per file.
            </Text>
          </View>

          {/* Upload Completion */}
          <View style={styles.completionCard}>
            <View>
              <Text style={styles.completionTitle}>
                Required documents
              </Text>

              <Text style={styles.completionText}>
                {uploadedRequiredCount} of{" "}
                {requiredDocuments.length} uploaded
              </Text>
            </View>

            <View style={[
            styles.completionBadge,
            allRequiredUploaded &&
                styles.completionBadgeDone,
        ]}>
              <Ionicons name={allRequiredUploaded
            ? "checkmark"
            : "time-outline"} size={14} color={allRequiredUploaded
            ? "#3AA957"
            : "#DE9248"}/>

              <Text style={[
            styles.completionBadgeText,

            allRequiredUploaded &&
                styles.completionBadgeTextDone,
        ]}>
                {allRequiredUploaded
            ? "Complete"
            : "In progress"}
              </Text>
            </View>
          </View>

          {/* Documents */}
          <View style={styles.documentsContainer}>
            {documentRequirements.map((requirement) => (<UploadDocumentCard key={requirement.key} requirement={requirement} uploadedFile={documents[requirement.key]} hasError={missingDocuments.includes(requirement.key)} disabled={saving || processingFile} onUpload={() => openUploadOptions(requirement.key)} onRemove={() => removeDocument(requirement.key, requirement.title)}/>))}
          </View>

          {/* Privacy */}
          <View style={styles.privacyCard}>
            <View style={styles.privacyIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#658DB1"/>
            </View>

            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>
                Your documents are private
              </Text>

              <Text style={styles.privacyText}>
                They will only be accessed by the
                verification team and will never be shown
                to parents or children.
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} disabled={saving} style={styles.backActionButton}>
              <Text style={styles.backActionText}>
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={handleContinue} disabled={saving || processingFile} style={[
            styles.continueButtonWrapper,
            (saving || processingFile) &&
                styles.disabledButton,
        ]}>
              <LinearGradient colors={["#8DC0F0", "#F9A8A7"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.continueButton}>
                {saving ? (<ActivityIndicator color="#171A1E"/>) : (<>
                    <Text style={styles.continueButtonText}>
                      Continue
                    </Text>

                    <Ionicons name="arrow-forward" size={18} color="#171A1E"/>
                  </>)}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Upload Options */}
      <Modal visible={uploadModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={closeUploadOptions}>
        <Pressable style={styles.modalOverlay} onPress={closeUploadOptions}>
          <Pressable style={styles.modalContent} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHandle}/>

            <Text style={styles.modalTitle}>
              {activeRequirement?.title ||
            "Upload Document"}
            </Text>

            <Text style={styles.modalDescription}>
              Choose how you want to add this document.
            </Text>

            <TouchableOpacity activeOpacity={0.8} onPress={takePhoto} disabled={processingFile} style={styles.uploadOption}>
              <View style={[
            styles.uploadOptionIcon,
            {
                backgroundColor: "#EAF5FF",
            },
        ]}>
                <Ionicons name="camera-outline" size={22} color="#5999CF"/>
              </View>

              <View style={styles.uploadOptionText}>
                <Text style={styles.uploadOptionTitle}>
                  {activeDocumentKey === "selfie"
            ? "Take Selfie"
            : "Take Photo"}
                </Text>

                <Text style={styles.uploadOptionDescription}>
                  Use your phone camera
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#8A9096"/>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={choosePhoto} disabled={processingFile} style={styles.uploadOption}>
              <View style={[
            styles.uploadOptionIcon,
            {
                backgroundColor: "#FFF0F1",
            },
        ]}>
                <Ionicons name="images-outline" size={22} color="#DF8990"/>
              </View>

              <View style={styles.uploadOptionText}>
                <Text style={styles.uploadOptionTitle}>
                  Choose Photo
                </Text>

                <Text style={styles.uploadOptionDescription}>
                  Select an image from your gallery
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#8A9096"/>
            </TouchableOpacity>

            {activeRequirement?.allowPdf ? (<TouchableOpacity activeOpacity={0.8} onPress={chooseFile} disabled={processingFile} style={styles.uploadOption}>
                <View style={[
                styles.uploadOptionIcon,
                {
                    backgroundColor: "#EAF8EE",
                },
            ]}>
                  <Ionicons name="document-attach-outline" size={22} color="#49A965"/>
                </View>

                <View style={styles.uploadOptionText}>
                  <Text style={styles.uploadOptionTitle}>
                    Choose PDF or File
                  </Text>

                  <Text style={styles.uploadOptionDescription}>
                    Select a document from your device
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#8A9096"/>
              </TouchableOpacity>) : null}

            {processingFile ? (<View style={styles.processingRow}>
                <ActivityIndicator size="small" color="#75AADA"/>

                <Text style={styles.processingText}>
                  Processing your file...
                </Text>
              </View>) : null}

            <TouchableOpacity activeOpacity={0.8} onPress={closeUploadOptions} disabled={processingFile} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>);
}
function UploadDocumentCard({ requirement, uploadedFile, hasError, disabled, onUpload, onRemove, }: {
    requirement: DocumentRequirement;
    uploadedFile?: UploadedFile;
    hasError: boolean;
    disabled: boolean;
    onUpload: () => void;
    onRemove: () => void;
}) {
    const isImage = uploadedFile?.mimeType.startsWith("image/");
    return (<View style={[
            styles.documentCard,
            hasError && styles.documentCardError,
            uploadedFile &&
                styles.documentCardUploaded,
        ]}>
      <View style={styles.documentTopRow}>
        <View style={[
            styles.documentIcon,
            {
                backgroundColor: requirement.iconBackground,
            },
        ]}>
          <Ionicons name={requirement.icon} size={23} color={requirement.iconColor}/>
        </View>

        <View style={styles.documentInformation}>
          <View style={styles.documentTitleRow}>
            <Text style={styles.documentTitle}>
              {requirement.title}
            </Text>

            <View style={[
            styles.requirementBadge,
            !requirement.required &&
                styles.optionalBadge,
        ]}>
              <Text style={[
            styles.requirementBadgeText,
            !requirement.required &&
                styles.optionalBadgeText,
        ]}>
                {requirement.required
            ? "Required"
            : "Optional"}
              </Text>
            </View>
          </View>

          <Text style={styles.documentDescription}>
            {requirement.description}
          </Text>
        </View>
      </View>

      {uploadedFile ? (<View style={styles.uploadedFileContainer}>
          <View style={styles.filePreview}>
            {isImage ? (<Image source={{
                    uri: uploadedFile.uri,
                }} style={styles.previewImage} contentFit="cover"/>) : (<Ionicons name="document-text-outline" size={25} color="#E15E65"/>)}
          </View>

          <View style={styles.fileInformation}>
            <View style={styles.fileStatusRow}>
              <Ionicons name="checkmark-circle" size={16} color="#48B25D"/>

              <Text style={styles.uploadedText}>
                Uploaded successfully
              </Text>
            </View>

            <Text style={styles.fileName} numberOfLines={1}>
              {uploadedFile.name}
            </Text>

            <Text style={styles.fileSize}>
              {formatFileSize(uploadedFile.size)}
            </Text>
          </View>

          <View style={styles.fileActions}>
            <TouchableOpacity activeOpacity={0.7} onPress={onUpload} disabled={disabled} style={styles.smallActionButton}>
              <Ionicons name="refresh-outline" size={18} color="#6398C3"/>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={onRemove} disabled={disabled} style={styles.smallActionButton}>

              <Ionicons name="trash-outline" size={18} color="#E45D65"/>
            </TouchableOpacity>
          </View>
        </View>) : (<TouchableOpacity activeOpacity={0.85} onPress={onUpload} disabled={disabled} style={styles.uploadButton}>
          <Ionicons name="cloud-upload-outline" size={18} color="#679AC5"/>

          <Text style={styles.uploadButtonText}>
            Upload Document
          </Text>
        </TouchableOpacity>)}

      {hasError ? (<Text style={styles.missingText}>
          This document is required.
        </Text>) : null}
    </View>);
}
function formatFileSize(size?: number): string {
    if (!size)
        return "File ready";
    if (size < 1024) {
        return `${size} B`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    background: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    loadingText: {
        fontSize: 13,
        color: "#7D838A",
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 22,
        paddingTop: 4,
        paddingBottom: 30,
    },
    header: {
        height: 54,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerBackButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "flex-start",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#22262A",
    },
    headerPlaceholder: {
        width: 40,
    },
    progressSection: {
        marginTop: 5,
        marginBottom: 22,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    progressStep: {
        fontSize: 11,
        fontWeight: "600",
        color: "#6E747B",
    },
    progressPercentage: {
        fontSize: 11,
        fontWeight: "600",
        color: "#E38D94",
    },
    progressTrack: {
        width: "100%",
        height: 7,
        borderRadius: 999,
        overflow: "hidden",
        backgroundColor: "#ECEEF1",
    },
    progressFill: {
        width: "75%",
        height: "100%",
        borderRadius: 999,
    },
    introduction: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 17,
    },
    introductionIcon: {
        width: 57,
        height: 57,
        borderRadius: 17,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    introductionContent: {
        flex: 1,
    },
    pageTitle: {
        fontSize: 19,
        lineHeight: 25,
        fontWeight: "700",
        color: "#22262A",
    },
    pageSubtitle: {
        marginTop: 5,
        fontSize: 10.5,
        lineHeight: 16,
        color: "#858B92",
    },
    instructionsCard: {
        backgroundColor: "#EAF5FF",
        borderRadius: 13,
        paddingHorizontal: 13,
        paddingVertical: 13,
        marginBottom: 14,
    },
    instructionsTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        marginBottom: 9,
    },
    instructionsTitle: {
        fontSize: 11.5,
        fontWeight: "700",
        color: "#55758F",
    },
    instructionText: {
        marginTop: 4,
        fontSize: 9.5,
        lineHeight: 14,
        color: "#688298",
    },
    completionCard: {
        minHeight: 67,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5EBEF",
        borderRadius: 13,
        paddingHorizontal: 13,
        marginBottom: 14,
    },
    completionTitle: {
        fontSize: 11.5,
        fontWeight: "700",
        color: "#30353A",
    },
    completionText: {
        marginTop: 5,
        fontSize: 9.5,
        color: "#8A9096",
    },
    completionBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#FFF4E8",
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 6,
    },
    completionBadgeDone: {
        backgroundColor: "#E8F8EC",
    },
    completionBadgeText: {
        fontSize: 8.5,
        color: "#DE9248",
    },
    completionBadgeTextDone: {
        color: "#3AA957",
    },
    documentsContainer: {
        gap: 11,
        marginBottom: 17,
    },
    documentCard: {
        backgroundColor: "rgba(255,255,255,0.94)",
        borderWidth: 1,
        borderColor: "#E5EAEE",
        borderRadius: 15,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    documentCardUploaded: {
        borderColor: "#CFE8D5",
    },
    documentCardError: {
        borderColor: "#EF676D",
    },
    documentTopRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    documentIcon: {
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    documentInformation: {
        flex: 1,
    },
    documentTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    documentTitle: {
        flex: 1,
        fontSize: 12,
        fontWeight: "700",
        color: "#292D31",
    },
    documentDescription: {
        marginTop: 5,
        fontSize: 9,
        lineHeight: 14,
        color: "#7D838A",
    },
    requirementBadge: {
        backgroundColor: "#FFF0F1",
        borderRadius: 999,
        paddingHorizontal: 7,

        paddingVertical: 4,
    },
    requirementBadgeText: {
        fontSize: 7.5,
        color: "#E1878E",
    },
    optionalBadge: {
        backgroundColor: "#F0F2F4",
    },
    optionalBadgeText: {
        color: "#81878E",
    },
    uploadButton: {
        height: 41,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 7,
        backgroundColor: "#F0F7FD",
        borderWidth: 1,
        borderColor: "#D7E8F5",
        borderRadius: 10,
        marginTop: 11,
    },
    uploadButtonText: {
        fontSize: 10.5,
        fontWeight: "600",
        color: "#5E89AB",
    },
    uploadedFileContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F6FAF7",
        borderRadius: 11,
        paddingHorizontal: 9,
        paddingVertical: 9,
        marginTop: 11,
    },
    filePreview: {
        width: 43,
        height: 43,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#FFE9EA",
        marginRight: 9,
    },
    previewImage: {
        width: "100%",
        height: "100%",
    },
    fileInformation: {
        flex: 1,
    },
    fileStatusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    uploadedText: {
        fontSize: 8.5,
        fontWeight: "600",
        color: "#48A95B",
    },
    fileName: {
        marginTop: 4,
        fontSize: 9.5,
        fontWeight: "600",
        color: "#3C4146",
    },
    fileSize: {
        marginTop: 3,
        fontSize: 8,
        color: "#90969C",
    },
    fileActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    smallActionButton: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    missingText: {
        marginTop: 7,
        fontSize: 9,
        color: "#E34E55",
    },
    privacyCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#EEF6FF",
        borderRadius: 13,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 20,
    },
    privacyIcon: {
        width: 35,
        height: 35,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        marginRight: 10,
    },
    privacyContent: {
        flex: 1,
    },
    privacyTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: "#56748C",
    },
    privacyText: {
        marginTop: 5,
        fontSize: 9,
        lineHeight: 14,
        color: "#688198",
    },
    actionsRow: {
        flexDirection: "row",
        gap: 10,
    },
    backActionButton: {
        width: 96,
        height: 54,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DDE4E9",
        borderRadius: 999,
    },
    backActionText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6C737A",
    },
    continueButtonWrapper: {
        flex: 1,
    },
    disabledButton: {
        opacity: 0.65,
    },
    continueButton: {
        height: 54,
        borderRadius: 999,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    continueButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#171A1E",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(20,24,28,0.45)",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        paddingHorizontal: 20,
        paddingTop: 11,
        paddingBottom: 30,
    },
    modalHandle: {
        width: 46,
        height: 5,
        alignSelf: "center",
        backgroundColor: "#D5D8DC",
        borderRadius: 999,
        marginBottom: 19,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#22262A",
    },
    modalDescription: {
        marginTop: 6,
        marginBottom: 17,
        fontSize: 10.5,
        color: "#858B92",
    },
    uploadOption: {
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
        borderWidth: 1,
        borderColor: "#ECEEF0",
        borderRadius: 13,
        paddingHorizontal: 11,
        marginBottom: 9,
    },
    uploadOptionIcon: {
        width: 41,
        height: 41,
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    uploadOptionText: {
        flex: 1,
    },
    uploadOptionTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#33383D",
    },
    uploadOptionDescription: {
        marginTop: 4,
        fontSize: 9,
        color: "#8A9096",
    },
    processingRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        paddingVertical: 12,
    },
    processingText: {
        fontSize: 10,
        color: "#71828F",
    },
    cancelButton: {
        height: 49,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E1E5E8",
        borderRadius: 999,
        marginTop: 5,
    },
    cancelButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6E747A",
    },
});
