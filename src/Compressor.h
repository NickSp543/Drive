#ifndef COMPRESSOR_H
#define COMPRESSOR_H

#include <string>
#include <vector>
using std::string;

namespace Compressor {
    void add(const string& filename, const string& data);
    string get(const string& filename);
    std::vector<std::string> search(const string& text);
    void loadExistingFiles();

    /*Deletes a file from storage and the createdFiles vector.
    Returns 0 upon successful deletion, 1 if the file didn't exist, 
    -1 for filesystem error.*/
    int deletef(const string& filename);
}

#endif
