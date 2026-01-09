#ifndef SEARCHCOMMAND_H
#define SEARCHCOMMAND_H

#include "ICommand.h"
#include "Compressor.h"

class SearchCommand : public ICommand {
public:
    bool execute(const InputChecker& ic, string& response) override; // given a string, return a list of filenames containing the string
};

#endif