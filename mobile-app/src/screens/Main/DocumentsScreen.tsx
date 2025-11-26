import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Button, Card, Text, FAB, Portal, Dialog, List, ProgressBar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { uploadDocument } from '../../store/slices/documentSlice';
import cameraService from '../../services/camera';
import { useTranslation } from 'react-i18next';

const DocumentsScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { documents, uploadProgress, loading } = useSelector((state: RootState) => state.document);
  const [uploadDialogVisible, setUploadDialogVisible] = useState(false);

  const handleScanDocument = async () => {
    try {
      setUploadDialogVisible(false);
      const result = await cameraService.scanDocument();
      
      if (result) {
        dispatch(uploadDocument({
          uri: result.uri,
          type: 'document',
          name: `Dokument_${new Date().getTime()}.jpg`,
        }) as any);
      }
    } catch (error) {
      Alert.alert(
        t('documents.error.title'),
        t('documents.error.cameraFailed')
      );
    }
  };

  const handlePickFromGallery = async () => {
    try {
      setUploadDialogVisible(false);
      const result = await cameraService.pickDocument();
      
      if (result) {
        dispatch(uploadDocument({
          uri: result.uri,
          type: 'document',
          name: `Dokument_${new Date().getTime()}.jpg`,
        }) as any);
      }
    } catch (error) {
      Alert.alert(
        t('documents.error.title'),
        t('documents.error.pickFailed')
      );
    }
  };

  const handleTakePhoto = async () => {
    try {
      setUploadDialogVisible(false);
      const result = await cameraService.takePicture();
      
      if (result) {
        dispatch(uploadDocument({
          uri: result.uri,
          type: 'photo',
          name: `Foto_${new Date().getTime()}.jpg`,
        }) as any);
      }
    } catch (error) {
      Alert.alert(
        t('documents.error.title'),
        t('documents.error.cameraFailed')
      );
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      rental_contract: t('documents.types.rentalContract'),
      utility_bill: t('documents.types.utilityBill'),
      warning_letter: t('documents.types.warningLetter'),
      termination: t('documents.types.termination'),
      other: t('documents.types.other'),
    };
    return types[type] || type;
  };

  const getStatusLabel = (analyzed: boolean) => {
    return analyzed ? t('documents.status.analyzed') : t('documents.status.pending');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">{item.name}</Text>
              <Text variant="bodyMedium" style={styles.cardText}>
                {t('documents.type')}: {getDocumentTypeLabel(item.type)}
              </Text>
              <Text variant="bodyMedium" style={styles.cardText}>
                {t('documents.status.label')}: {getStatusLabel(item.analyzed)}
              </Text>
              {item.analyzed && item.issues && (
                <Text variant="bodySmall" style={styles.issuesText}>
                  {item.issues.length} {t('documents.issuesFound')}
                </Text>
              )}
            </Card.Content>
            <Card.Actions>
              <Button>{t('documents.viewDetails')}</Button>
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {t('documents.noDocuments')}
            </Text>
            <Button 
              mode="contained" 
              onPress={() => setUploadDialogVisible(true)} 
              style={styles.uploadButton}
              icon="camera"
            >
              {t('documents.scanDocument')}
            </Button>
          </View>
        }
      />

      {loading && uploadProgress > 0 && (
        <View style={styles.progressContainer}>
          <Text variant="bodySmall" style={styles.progressText}>
            {t('documents.uploading')}: {uploadProgress}%
          </Text>
          <ProgressBar progress={uploadProgress / 100} style={styles.progressBar} />
        </View>
      )}

      <FAB
        style={styles.fab}
        icon="camera"
        onPress={() => setUploadDialogVisible(true)}
        label={t('documents.scan')}
      />

      <Portal>
        <Dialog visible={uploadDialogVisible} onDismiss={() => setUploadDialogVisible(false)}>
          <Dialog.Title>{t('documents.uploadDocument')}</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title={t('documents.scanWithCamera')}
              description={t('documents.scanDescription')}
              left={(props) => <List.Icon {...props} icon="camera" />}
              onPress={handleScanDocument}
            />
            <List.Item
              title={t('documents.takePhoto')}
              description={t('documents.photoDescription')}
              left={(props) => <List.Icon {...props} icon="camera-image" />}
              onPress={handleTakePhoto}
            />
            <List.Item
              title={t('documents.chooseFromGallery')}
              description={t('documents.galleryDescription')}
              left={(props) => <List.Icon {...props} icon="image" />}
              onPress={handlePickFromGallery}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUploadDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  card: {
    margin: 8,
    elevation: 2,
  },
  cardText: {
    marginTop: 4,
  },
  issuesText: {
    marginTop: 8,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadButton: {
    marginTop: 16,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default DocumentsScreen;
