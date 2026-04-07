import { View, Text } from '../src/tw';

export default function IndexScreen() {
  return (
    <View className="flex-1 bg-echo-bg items-center justify-center">
      <Text className="text-white text-3xl font-bold">Echo MLP Base</Text>
      <Text className="text-echo-gray mt-2">Mobile & Widget Environment Ready</Text>
    </View>
  );
}
