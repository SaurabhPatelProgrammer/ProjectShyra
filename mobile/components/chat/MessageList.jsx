import React, { useRef, useEffect } from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, loading }) {
    const flatListRef = useRef(null);

    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages]);

    if (messages.length === 0 && !loading) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>👋</Text>
                <Text style={styles.emptyTitle}>Hi! I'm SHYRA</Text>
                <Text style={styles.emptySubtitle}>Your AI assistant. How can I help you today?</Text>
            </View>
        );
    }

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        paddingVertical: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#AAAAAA',
        textAlign: 'center',
    },
});
