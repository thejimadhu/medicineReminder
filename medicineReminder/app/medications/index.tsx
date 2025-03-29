import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MedicationItem = ({ medId, name, time }) => {
  const [skipped, setSkipped] = useState(false);

  const handleSkipDose = async () => {
    try {
      const skippedMeds = JSON.parse(await AsyncStorage.getItem("skippedDoses")) || [];
      const updatedSkippedMeds = [...skippedMeds, { medId, name, time, date: new Date().toISOString() }];
      await AsyncStorage.setItem("skippedDoses", JSON.stringify(updatedSkippedMeds));
      setSkipped(true);
    } catch (error) {
      console.error("Error saving skipped dose:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{name} - {time}</Text>
      {skipped ? (
        <Text style={styles.skippedText}>Skipped</Text>
      ) : (
        <Button title="Skip Dose" onPress={handleSkipDose} color="red" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: "row", justifyContent: "space-between", padding: 10 },
  text: { fontSize: 16 },
  skippedText: { color: "red", fontSize: 16, fontWeight: "bold" },
});

export default MedicationItem;
