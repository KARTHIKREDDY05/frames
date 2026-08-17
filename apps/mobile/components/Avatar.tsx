import { Image, StyleSheet, View } from "react-native";

export function Avatar({ uri, size = 42 }: { uri?: string | null; size?: number }) {
  return <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>{uri ? <Image source={{ uri }} style={StyleSheet.absoluteFillObject} /> : null}</View>;
}

const styles = StyleSheet.create({ wrap: { overflow: "hidden", backgroundColor: "#D8CBE5" } });
