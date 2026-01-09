#ifndef DELETECOMMAND_H
#define DELETECOMMAND_H

#include "ICommand.h"
#include "Compressor.h"

class DeleteCommand : public ICommand {
public:
    bool execute(const InputChecker& ic, string& response) override; // delete a file given a filename
};

#endif