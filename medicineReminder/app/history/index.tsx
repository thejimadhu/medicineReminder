import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import {
    getDoseHistory,
    getMedications,
    DoseHistory,
    Medication,
    clearAllData,
} from "../../utils/storage";

type EnrichedDoseHistory = DoseHistory & { medication?: Medication };

export default function HistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<EnrichedDoseHistory[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<
        "all" | "taken" | "missed"
>("all");

    const loadHistory = useCallback(async () => {
        try {
            const [doseHistory, medications] = await Promise.all([
                getDoseHistory(),
                getMedications(),
            ]);

            // Combine history with medication details
            const enrichedHistory = doseHistory.map((dose) => ({
                ...dose,
                medication: medications.find((med) => med.id === dose.medicationId),
            }));

            setHistory(enrichedHistory);
        } catch (error) {
            console.error("Error loading history:", error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [loadHistory])
    );

    const groupHistoryByDate = () => {
        const grouped = history.reduce((acc, dose) => {
            const date = new Date(dose.timestamp).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(dose);
            return acc;
        }, {} as Record<string, EnrichedDoseHistory[]>);

        return Object.entries(grouped).sort(
            (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
        );
    };

    const filteredHistory = history.filter((dose) => {
        if (selectedFilter === "all") return true;
        if (selectedFilter === "taken") return dose.taken;
        if (selectedFilter === "missed") return !dose.taken;
        return true;
    });

    const groupedHistory = groupHistoryByDate();

    const handleClearAllData = () => {
        Alert.alert(
            "Clear All Data",
            "Are you sure you want to clear all medication data? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await clearAllData();
                            await loadHistory();
                            Alert.alert("Success", "All data has been cleared successfully");
                        } catch (error) {
                            console.error("Error clearing data:", error);
                            Alert.alert("Error", "Failed to clear data. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#1a8e2d", "#146922"]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />

            <View style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={28} color="#1a8e2d" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>History Log</Text>
                </View>

                <View style={styles.filtersContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filtersScroll}
                    >
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                selectedFilter === "all" && styles.filterButtonActive,
                            ]}
                            onPress={() => setSelectedFilter("all")}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    selectedFilter === "all" && styles.filterTextActive,
                                ]}
                            >
                                All
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                selectedFilter === "taken" && styles.filterButtonActive,
                            ]}
                            onPress={() => setSelectedFilter("taken")}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    selectedFilter === "taken" && styles.filterTextActive,
                                ]}
                            >
                                Taken
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                selectedFilter === "missed" && styles.filterButtonActive,
                            ]}
                            onPress={() => setSelectedFilter("missed")}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    selectedFilter === "missed" && styles.filterTextActive,
                                ]}
                            >
                                Missed
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                <ScrollView
                    style={styles.historyContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {groupedHistory.map(([date, doses]) => (
                        <View key={date} style={styles.dateGroup}>
                            <Text style={styles.dateHeader}>
                                {new Date(date).toLocaleDateString("default", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </Text>
                            {doses.map((dose) => (
                                <View key={dose.id} style={styles.historyCard}>
                                    <View
                                        style={[
                                            styles.medicationColor,
                                            { backgroundColor: dose.medication?.color || "#ccc" },
                                        ]}
                                    />
                                    <View style={styles.medicationInfo}>
                                        <Text style={styles.medicationName}>
                                            {dose.medication?.name || "Unknown Medication"}
                                        </Text>
                                        <Text style={styles.medicationDosage}>
                                            {dose.medication?.dosage}
                                        </Text>
                                        <Text style={styles.timeText}>
                                            {new Date(dose.timestamp).toLocaleTimeString("default", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </View>
                                    <View style={styles.statusContainer}>
                                        {dose.taken ? (
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    { backgroundColor: "#E8F5E9" },
                                                ]}
                                            >
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={16}
                                                    color="#4CAF50"
                                                />
                                                <Text style={[styles.statusText, { color: "#4CAF50" }]}>
                                                    Taken
                                                </Text>
                                            </View>
                                        ) : (
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    { backgroundColor: "#FFEBEE" },
                                                ]}
                                            >
                                                <Ionicons
                                                    name="close-circle"
                                                    size={16}
                                                    color="#F44336"
                                                />
                                                <Text style={[styles.statusText, { color: "#F44336" }]}>
                                                    Missed
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}

                    <View style={styles.clearDataContainer}>
                        <TouchableOpacity
                            style={styles.clearDataButton}
                            onPress={handleClearAllData}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF5252" />
                            <Text style={styles.clearDataText}>Clear All Data</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: Platform.OS === "ios" ? 140 : 120,
    },
    content: {
        flex: 1,
        paddingTop: Platform.OS === "ios" ? 50 : 30,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 20,
        zIndex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginLeft: 10,
        color: "#1a8e2d",
    },
    filtersContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    filtersScroll: {
        flexDirection: "row",
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#E0E0E0",
        marginRight: 10,
    },
    filterButtonActive: {
        backgroundColor: "#1a8e2d",
    },
    filterText: {
        fontSize: 14,
        color: "#333",
    },
    filterTextActive: {
        color: "#fff",
        fontWeight: "bold",
    },
    historyContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    dateGroup: {
        marginBottom: 20,
    },
    dateHeader: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#666",
        marginBottom: 8,
    },
    historyCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    medicationColor: {
        width: 8,
        height: "100%",
        borderRadius: 4,
        marginRight: 10,
    },
    medicationInfo: {
        flex: 1,
    },
    medicationName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    medicationDosage: {
        fontSize: 14,
        color: "#666",
    },
    timeText: {
        fontSize: 14,
        color: "#999",
    },
    statusContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    statusText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: "bold",
    },
    clearDataContainer: {
        alignItems: "center",
        marginVertical: 20,
    },
    clearDataButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFEBEE",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    clearDataText: {
        marginLeft: 8,
        color: "#FF5252",
        fontSize: 14,
        fontWeight: "bold",
    },
});

export default styles;
