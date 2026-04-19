package com.nidhi.distributedstorage.repository;

import com.nidhi.distributedstorage.model.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {
    List<FileMetadata> findByFileNameAndStatus(String fileName, String status);
    List<FileMetadata> findByFileName(String fileName);
    List<FileMetadata> findByUserEmail(String userEmail);

    @Transactional
    void deleteByFileName(String fileName);
}