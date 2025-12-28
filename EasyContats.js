import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, Image, TouchableOpacity, Linking, TextInput, FlatList as NativeFlatList, SafeAreaView } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const { width, height } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

// --- DATA ---
const CONTACTS = [
  { id: '1', name: 'Syed', relation: 'Creative Director', phone: '+15550192834', displayPhone: '+1 (555) 019-2834', email: 'sarah.j@agency.design', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop' },
  { id: '2', name: 'Hunain', relation: 'Grandson', phone: '+15550419921', displayPhone: '+1 (555) 041-9921', email: 'julian.dev@tech.io', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop' },
  { id: '3', name: 'Aijaz', relation: 'Product Manager', phone: '+15550911122', displayPhone: '+1 (555) 091-1122', email: 'eliana.s@startup.com', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1770&auto=format&fit=crop' },
  { id: '4', name: 'James Cooper', relation: 'Marketing Lead', phone: '+15551234567', displayPhone: '+1 (555) 123-4567', email: 'james.c@market.net', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop' },
  { id: '5', name: 'Mia Wong', relation: 'UX Researcher', phone: '+15559876543', displayPhone: '+1 (555) 987-6543', email: 'mia.w@research.lab', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop' },
];

// --- COMPONENTS ---

// 1. SEARCH BAR COMPONENT
const SearchBar = ({ value, onChange }) => (
  <View style={styles.searchContainer}>
    <Ionicons name="search" size={24} color="#666" style={{ marginRight: 10 }} />
    <TextInput 
      style={styles.searchInput}
      placeholder="Search Contacts..."
      placeholderTextColor="#666"
      value={value}
      onChangeText={onChange}
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChange('')}>
        <Ionicons name="close-circle" size={24} color="#666" />
      </TouchableOpacity>
    )}
  </View>
);

// 2. CARD COMPONENT (For Favorites)
const CARD_HEIGHT = height * 0.65; // Slightly reduced to fit TabBar
const SPACING = 20;
const ITEM_SIZE = CARD_HEIGHT + SPACING;
const SPACER_HEIGHT = (height - ITEM_SIZE) / 2 - 50; // Adjusted for search bar

const Card = ({ item, index, scrollY }) => {
  const rStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * ITEM_SIZE, index * ITEM_SIZE, (index + 1) * ITEM_SIZE];
    const scale = interpolate(scrollY.value, inputRange, [0.9, 1, 0.9], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, inputRange, [0.6, 1, 0.6], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  const handleCall = () => {
    Speech.speak(`Calling ${item.name}`);
    Linking.openURL(`tel:${item.phone}`);
  };

  return (
    <Animated.View style={[styles.cardContainer, rStyle]}>
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.imageBackground} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.gradient} />
        <View style={styles.bottomRow}>
            <View style={styles.textContainer}>
                <Text style={styles.relation}>{item.relation.toUpperCase()}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.divider} />
                <Text style={styles.contactInfo}>{item.displayPhone}</Text>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
                <Ionicons name="call" size={28} color="white" />
            </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// --- SCREENS ---

// SCREEN 1: FAVORITES (Your Original Carousel)
function FavoritesScreen() {
  const [search, setSearch] = useState('');
  const [filteredContacts, setFilteredContacts] = useState(CONTACTS);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    setFilteredContacts(
      CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Speech Logic
  const speakName = (name) => Speech.speak(name, { language: 'en', rate: 0.9 });

  const handleMomentumScrollEnd = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_SIZE);
    if (index >= 0 && index < filteredContacts.length) {
      speakName(filteredContacts[index].name);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar value={search} onChange={setSearch} />
      
      {filteredContacts.length === 0 ? (
         <View style={styles.emptyState}><Text style={styles.emptyText}>No matches found</Text></View>
      ) : (
        <Animated.FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <Card item={item} index={index} scrollY={scrollY} />}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            snapToInterval={ITEM_SIZE}
            decelerationRate="fast"
            snapToAlignment="start"
            onMomentumScrollEnd={handleMomentumScrollEnd}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: SPACER_HEIGHT }}
            showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// SCREEN 2: ALL CONTACTS LIST (Standard List)
function AllContactsScreen() {
  const [search, setSearch] = useState('');
  const [filteredContacts, setFilteredContacts] = useState(CONTACTS);

  useEffect(() => {
    setFilteredContacts(
      CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  const renderRow = ({ item }) => (
    <TouchableOpacity 
      style={styles.listRow} 
      onPress={() => {
        Speech.speak(item.name);
        Linking.openURL(`tel:${item.phone}`);
      }}
    >
      <Image source={{ uri: item.image }} style={styles.listAvatar} />
      <View style={styles.listTextContainer}>
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listRelation}>{item.relation}</Text>
      </View>
      <View style={styles.listCallIcon}>
        <Ionicons name="call" size={20} color="white" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar value={search} onChange={setSearch} />
      <NativeFlatList 
        data={filteredContacts}
        keyExtractor={item => item.id}
        renderItem={renderRow}
        contentContainerStyle={{ padding: 20 }}
      />
    </SafeAreaView>
  );
}

// --- MAIN APP (NAVIGATION) ---
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0F1115',
            borderTopWidth: 0,
            height: 80, // Taller tab bar for easy pressing
            paddingBottom: 20,
            paddingTop: 10,
          },
          tabBarActiveTintColor: '#FF3B30',
          tabBarInactiveTintColor: '#666',
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Favorites') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'All Contacts') {
              iconName = focused ? 'people' : 'people-outline';
            }
            // Larger Icons for Accessibility
            return <Ionicons name={iconName} size={32} color={color} />;
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          }
        })}
      >
        <Tab.Screen name="Favorites" component={FavoritesScreen} />
        <Tab.Screen name="All Contacts" component={AllContactsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  // SEARCH BAR STYLES
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 55,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333'
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    height: '100%',
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center'},
  emptyText: { color: '#666', fontSize: 18 },

  // CARD STYLES (Existing)
  cardContainer: { height: ITEM_SIZE, justifyContent: 'center', alignItems: 'center', width: width },
  card: { width: width * 0.85, height: CARD_HEIGHT, borderRadius: 35, overflow: 'hidden', backgroundColor: '#1E1E1E', elevation: 10 },
  imageBackground: { width: '100%', height: '100%', resizeMode: 'cover' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  bottomRow: { position: 'absolute', bottom: 30, left: 24, right: 24, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  textContainer: { flex: 1, paddingRight: 10 },
  relation: { color: '#FF3B30', fontWeight: '700', fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  name: { color: 'white', fontSize: 32, fontWeight: '800', marginBottom: 12 },
  divider: { height: 1, width: 40, backgroundColor: '#FF3B30', marginBottom: 12 },
  contactInfo: { color: '#E0E0E0', fontSize: 14, marginBottom: 4, fontWeight: '500' },
  callButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', elevation: 6, marginBottom: 5 },

  // LIST ROW STYLES (New)
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginBottom: 15,
    padding: 15,
    borderRadius: 20,
  },
  listAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  listTextContainer: {
    flex: 1,
  },
  listName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listRelation: {
    color: '#999',
    fontSize: 14,
    marginTop: 2,
  },
  listCallIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759', // Green for list view
    justifyContent: 'center',
    alignItems: 'center',
  }
});